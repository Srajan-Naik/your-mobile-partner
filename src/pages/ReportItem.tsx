import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateLostItem, useUploadLostItemImage } from "@/hooks/use-lost-items";
import { reportItemSchema, type ReportItemFormData, FORM_STEPS } from "@/lib/validations/report-item";
import { cn } from "@/lib/utils";

// Step components
import { ItemDetailsStep } from "@/components/report-item/ItemDetailsStep";
import { LocationTimeStep } from "@/components/report-item/LocationTimeStep";
import { AutoDetailsStep } from "@/components/report-item/AutoDetailsStep";
import { PhotosStep } from "@/components/report-item/PhotosStep";

export default function ReportItem() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const createLostItem = useCreateLostItem();
  const uploadImage = useUploadLostItemImage();

  const form = useForm<ReportItemFormData>({
    resolver: zodResolver(reportItemSchema),
    defaultValues: {
      category: undefined,
      title: "",
      description: "",
      lost_date: undefined,
      lost_location_address: "",
      auto_number: "",
      route_description: "",
      driver_description: "",
    },
  });

  const progress = (currentStep / FORM_STEPS.length) * 100;

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        return await form.trigger(["category", "title", "description"]);
      case 2:
        return await form.trigger(["lost_date", "lost_location_address"]);
      case 3:
        return await form.trigger(["auto_number", "route_description", "driver_description"]);
      case 4:
        return true; // Photos are optional
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < FORM_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    const data = form.getValues();
    if (!data.category || !data.title || !data.lost_date) {
      form.setError("root", { message: "Please fill in at least item category, title, and date" });
      return;
    }

    try {
      await createLostItem.mutateAsync({
        category: data.category,
        title: data.title,
        lost_date: data.lost_date,
        description: data.description,
        lost_location_address: data.lost_location_address,
        auto_number: data.auto_number,
        route_description: data.route_description,
        driver_description: data.driver_description,
        is_draft: true,
      });
      navigate("/my-reports");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onSubmit = async (data: ReportItemFormData) => {
    try {
      const result = await createLostItem.mutateAsync({
        category: data.category,
        title: data.title,
        lost_date: data.lost_date,
        description: data.description,
        lost_location_address: data.lost_location_address,
        auto_number: data.auto_number,
        route_description: data.route_description,
        driver_description: data.driver_description,
        is_draft: false,
      });

      // Upload images if any
      if (uploadedFiles.length > 0 && result.id) {
        await Promise.all(
          uploadedFiles.map((file, index) =>
            uploadImage.mutateAsync({
              lostItemId: result.id,
              file,
              displayOrder: index,
            })
          )
        );
      }

      navigate("/my-reports");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = createLostItem.isPending || uploadImage.isPending;

  return (
    <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-heading text-lg font-semibold">Report Lost Item</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {FORM_STEPS.length}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-3 bg-muted/50">
          <p className="font-medium">{FORM_STEPS[currentStep - 1].title}</p>
          <p className="text-sm text-muted-foreground">
            {FORM_STEPS[currentStep - 1].description}
          </p>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto p-4">
          <form id="report-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className={cn(currentStep !== 1 && "hidden")}>
              <ItemDetailsStep form={form} />
            </div>
            <div className={cn(currentStep !== 2 && "hidden")}>
              <LocationTimeStep form={form} />
            </div>
            <div className={cn(currentStep !== 3 && "hidden")}>
              <AutoDetailsStep form={form} />
            </div>
            <div className={cn(currentStep !== 4 && "hidden")}>
              <PhotosStep
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive mt-4">
                {form.formState.errors.root.message}
              </p>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            <div className="flex-1" />

            <Button
              variant="ghost"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>

            {currentStep < FORM_STEPS.length ? (
              <Button onClick={handleNext} disabled={isSubmitting}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" form="report-form" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
