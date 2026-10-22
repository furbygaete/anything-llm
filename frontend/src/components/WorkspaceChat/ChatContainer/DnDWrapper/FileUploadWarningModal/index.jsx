import Modal, {
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/lib/Modal";
import { useTranslation } from "react-i18next";
import { numberWithCommas } from "@/utils/numbers";
import useUser from "@/hooks/useUser";
import { Link } from "react-router-dom";
import Paths from "@/utils/paths";

export default function FileUploadWarningModal({
  show,
  onClose,
  onContinue,
  onEmbed,
  tokenCount,
  maxTokens,
  fileCount = 1,
}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const canEmbed = !user || user.role !== "default";
  if (!show) return null;

  return (
    <Modal isOpen={show} onClose={onClose} size="lg">
      <ModalHeader
        title={t("customer-ui.context-warning-title")}
        onClose={onClose}
      />
      <ModalBody>
        <p className="text-zinc-300 light:text-slate-700 text-sm">
          {t("customer-ui.upload-warning-body", {
            used: numberWithCommas(tokenCount),
            max: numberWithCommas(maxTokens),
            count: fileCount,
          })}{" "}
          <Link
            target="_blank"
            to={Paths.documentation.contextWindows()}
            className="text-zinc-400 light:text-slate-500 text-sm underline"
          >
            {t("customer-ui.upload-warning-learn")} &rarr;
          </Link>
        </p>
        <p className="text-zinc-300 light:text-slate-700 text-sm">
          {t("customer-ui.upload-warning-choose")}
        </p>
      </ModalBody>
      <ModalFooter>
        <ModalSecondaryButton onClick={onClose} type="button">
          {t("customer-ui.cancel")}
        </ModalSecondaryButton>
        <div className="flex items-center gap-x-2">
          <ModalSecondaryButton onClick={onContinue} type="button">
            {t("customer-ui.continue-anyway")}
          </ModalSecondaryButton>
          {canEmbed && (
            <ModalPrimaryButton
              onClick={onEmbed}
              disabled={!canEmbed}
              type="button"
            >
              {t("customer-ui.embed-files")}
            </ModalPrimaryButton>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
