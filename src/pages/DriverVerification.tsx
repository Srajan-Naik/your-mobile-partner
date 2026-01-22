import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  FileCheck,
  Camera,
  Check,
  Clock,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useDriverVerification,
  useCreateOrUpdateDriverVerification,
  useSubmitVerification,
  useUploadVerificationDocument,
} from "@/hooks/use-driver-verification";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DriverVerification() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: verification, isLoading } = useDriverVerification();
  const updateVerification = useCreateOrUpdateDriverVerification();
  const submitVerification = useSubmitVerification();
  const uploadDocument = useUploadVerificationDocument();

  const [licenseNumber, setLicenseNumber] = useState(verification?.license_number || "");
  const [vehicleNumber, setVehicleNumber] = useState(verification?.vehicle_registration_number || "");

  const getStatusBadge = () => {
    switch (verification?.status) {
      case "approved":
        return <Badge className="bg-success">{t("verified")}</Badge>;
      case "submitted":
        return <Badge variant="secondary">{t("underReview")}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t("rejected")}</Badge>;
      default:
        return <Badge variant="outline">{t("notVerified")}</Badge>;
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    if (verification?.license_storage_path) completed++;
    if (verification?.vehicle_registration_storage_path) completed++;
    if (verification?.photo_verification_storage_path) completed++;
    return (completed / 3) * 100;
  };

  const handleFileUpload = async (file: File, documentType: "license" | "vehicle_registration" | "photo") => {
    try {
      const storagePath = await uploadDocument.mutateAsync({ file, documentType });

      const updateData: Record<string, string> = {};
      if (documentType === "license") {
        updateData.license_storage_path = storagePath;
        updateData.license_number = licenseNumber;
      } else if (documentType === "vehicle_registration") {
        updateData.vehicle_registration_storage_path = storagePath;
        updateData.vehicle_registration_number = vehicleNumber;
      } else {
        updateData.photo_verification_storage_path = storagePath;
      }

      await updateVerification.mutateAsync(updateData);
      toast.success(t("success"));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (calculateProgress() < 100) {
      toast.error(t("uploadAllDocuments"));
      return;
    }

    await submitVerification.mutateAsync();
  };

  const DocumentUploader = ({
    documentType,
    label,
    description,
    storagePath,
  }: {
    documentType: "license" | "vehicle_registration" | "photo";
    label: string;
    description: string;
    storagePath: string | null | undefined;
  }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => {
        if (files[0]) handleFileUpload(files[0], documentType);
      },
      accept: { "image/*": [".jpeg", ".jpg", ".png", ".pdf"] },
      maxFiles: 1,
      disabled: verification?.status === "submitted" || verification?.status === "approved",
    });

    const isUploaded = !!storagePath;
    const isDisabled = verification?.status === "submitted" || verification?.status === "approved";

    return (
      <Card className={cn(isUploaded && "border-success/50")}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                isUploaded ? "bg-success/10" : "bg-muted"
              )}
            >
              {isUploaded ? (
                <FileCheck className="h-5 w-5 text-success" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{label}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {isUploaded && <Check className="h-5 w-5 text-success" />}
          </div>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragActive && "border-primary bg-primary/5",
              isDisabled && "opacity-50 cursor-not-allowed",
              !isDisabled && "cursor-pointer hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            {documentType === "photo" ? (
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-sm text-muted-foreground">
              {isUploaded
                ? t("documentUploaded")
                : t("tapToUpload")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Layout userType="driver" userName={user?.name || ""} onLogout={signOut}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="driver" userName={user?.name || ""} onLogout={signOut}>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold">{t("verification")}</h1>
          </div>
          {getStatusBadge()}
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{t("verificationProgress")}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(calculateProgress())}%
              </p>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </CardContent>
        </Card>

        {/* Status Alert */}
        {verification?.status === "rejected" && verification.admin_notes && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{verification.admin_notes}</AlertDescription>
          </Alert>
        )}

        {verification?.status === "submitted" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {t("documentsBeingReviewed")}
            </AlertDescription>
          </Alert>
        )}

        {verification?.status === "approved" && (
          <Alert className="border-success/50 bg-success/10">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              {t("congratsVerified")}
            </AlertDescription>
          </Alert>
        )}

        {/* License Info */}
        {verification?.status !== "approved" && verification?.status !== "submitted" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("licenseDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{t("licenseNumber")}</Label>
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder={t("enterLicenseNumber")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">{t("vehicleRegNumber")}</Label>
                <Input
                  id="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder={t("enterVehicleReg")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Uploads */}
        <div className="space-y-3">
          <h2 className="font-medium">{t("requiredDocuments")}</h2>

          <DocumentUploader
            documentType="license"
            label={t("driversLicense")}
            description={t("clearLicensePhoto")}
            storagePath={verification?.license_storage_path}
          />

          <DocumentUploader
            documentType="vehicle_registration"
            label={t("vehicleRegistration")}
            description={t("autoRegistrationPhoto")}
            storagePath={verification?.vehicle_registration_storage_path}
          />

          <DocumentUploader
            documentType="photo"
            label={t("photoVerification")}
            description={t("clearSelfie")}
            storagePath={verification?.photo_verification_storage_path}
          />
        </div>

        {/* Submit Button */}
        {verification?.status !== "approved" && verification?.status !== "submitted" && (
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={calculateProgress() < 100 || submitVerification.isPending}
          >
            {submitVerification.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {t("submitForVerification")}
          </Button>
        )}
      </div>
    </Layout>
  );
}
