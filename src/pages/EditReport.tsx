import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoBack } from "@/hooks/use-go-back";
import { useLostItem, useUpdateLostItem } from "@/hooks/use-lost-items";
import { reportItemSchema, type ReportItemFormData } from "@/lib/validations/report-item";

// Step components
import { ItemDetailsStep } from "@/components/report-item/ItemDetailsStep";
import { LocationTimeStep } from "@/components/report-item/LocationTimeStep";
import { AutoDetailsStep } from "@/components/report-item/AutoDetailsStep";

export default function EditReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack("/my-reports");
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const { data: report, isLoading: loadingReport } = useLostItem(id);
  const updateLostItem = useUpdateLostItem();

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

  // Populate form when report loads
  useEffect(() => {
    if (report) {
      form.reset({
        category: report.category,
        title: report.title,
        description: report.description || "",
        lost_date: new Date(report.lost_date),
        lost_location_address: report.lost_location_address || "",
        auto_number: report.auto_number || "",
        route_description: report.route_description || "",
        driver_description: report.driver_description || "",
      });
    }
  }, [report, form]);

  const onSubmit = async (data: ReportItemFormData) => {
    if (!id) return;

    try {
      await updateLostItem.mutateAsync({
        id,
        category: data.category,
        title: data.title,
        lost_date: data.lost_date,
        description: data.description,
        lost_location_address: data.lost_location_address,
        auto_number: data.auto_number,
        route_description: data.route_description,
        driver_description: data.driver_description,
      });

      navigate(`/report/${id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (loadingReport) {
    return (
      <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <p className="text-lg font-medium">{t("reportNotFound")}</p>
          <Button onClick={() => navigate("/my-reports")} className="mt-4">
            {t("backToReports")}
          </Button>
        </div>
      </Layout>
    );
  }

  const isSubmitting = updateLostItem.isPending;

  return (
    <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-heading text-lg font-semibold">{t("editReport")}</h1>
              <p className="text-sm text-muted-foreground">{report.title}</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto p-4">
          <Form {...form}>
            <form id="edit-report-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Item Details */}
              <div className="space-y-4">
                <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  {t("itemDetails")}
                </h2>
                <ItemDetailsStep 
                  form={form} 
                  files={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                />
              </div>

              {/* Location & Time */}
              <div className="space-y-4">
                <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  {t("locationTime")}
                </h2>
                <LocationTimeStep form={form} />
              </div>

              {/* Auto Details */}
              <div className="space-y-4">
                <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  {t("autoDetails")}
                </h2>
                <AutoDetailsStep form={form} />
              </div>

              {form.formState.errors.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
            </form>
          </Form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-background">
          <Button
            type="submit"
            form="edit-report-form"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("saveChanges")}
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
