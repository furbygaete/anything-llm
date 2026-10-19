import { CloudArrowUp, Trash, UsersThree } from "@phosphor-icons/react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";

// Mirrors server/utils/sharedDocs.js: documents under this library folder are
// company-wide and only admins/managers may remove them.
const SHARED_PREFIX = "shared/";

/**
 * Document manager for `default`-role users (customers). They can only add to
 * and remove from workspaces they belong to; the server enforces membership on
 * both endpoints used here. Unlike the admin Documents tab this never touches
 * the global document library.
 */
export default function CustomerDocuments({ workspace }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState(workspace.documents ?? []);
  const [busy, setBusy] = useState(null); // filename being uploaded/removed

  async function refresh() {
    const ws = await Workspace.bySlug(workspace.slug);
    setDocs(ws?.documents ?? []);
  }

  async function onDrop(files) {
    for (const file of files) {
      setBusy(file.name);
      const formData = new FormData();
      formData.append("file", file, file.name);
      const { response, data } = await Workspace.uploadAndEmbedFile(
        workspace.slug,
        formData
      );
      if (!response.ok || !data?.success)
        showToast(
          `${file.name}: ${data?.error ?? t("customer-docs.upload-failed")}`,
          "error"
        );
    }
    setBusy(null);
    await refresh();
  }

  async function remove(doc) {
    if (
      !window.confirm(t("customer-docs.remove-confirm", { name: titleOf(doc) }))
    )
      return;
    setBusy(doc.filename);
    const ok = await Workspace.deleteAndUnembedFile(
      workspace.slug,
      doc.docpath
    );
    if (!ok) showToast(t("customer-docs.remove-failed"), "error");
    setBusy(null);
    await refresh();
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: !!busy,
  });

  return (
    <div className="flex flex-col gap-y-4 p-6 w-[600px]">
      <div
        {...getRootProps()}
        className={`w-full border-dashed border-[2px] border-theme-modal-border light:border-[#686C6F] rounded-2xl bg-theme-bg-primary p-6 flex flex-col items-center ${
          busy
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-theme-bg-secondary"
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUp className="w-8 h-8 text-white/80 light:invert" />
        <div className="text-white text-opacity-80 text-sm font-semibold py-1">
          {busy
            ? t("customer-docs.processing", { name: busy })
            : t("connectors.upload.click-upload")}
        </div>
        <div className="text-white text-opacity-60 text-xs font-medium py-1">
          {t("connectors.upload.file-types")}
        </div>
      </div>

      <div className="text-white text-sm font-semibold">
        {t("customer-docs.title", { count: docs.length })}
      </div>
      {docs.length === 0 ? (
        <p className="text-white/60 text-xs">{t("customer-docs.empty")}</p>
      ) : (
        <ul className="max-h-[260px] overflow-y-auto flex flex-col gap-y-1">
          {docs.map((doc) => {
            const shared = doc.docpath?.startsWith(SHARED_PREFIX);
            return (
              <li
                key={doc.docId}
                className="flex items-center justify-between bg-theme-bg-secondary rounded-lg px-3 py-2 text-white text-xs"
              >
                <span className="truncate mr-2" title={titleOf(doc)}>
                  {titleOf(doc)}
                </span>
                {shared ? (
                  <span
                    className="flex items-center gap-x-1 text-white/60 shrink-0"
                    title={t("customer-docs.shared")}
                  >
                    <UsersThree size={16} />
                    {t("customer-docs.shared")}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => remove(doc)}
                    aria-label={t("customer-docs.remove")}
                    className="border-none bg-transparent text-white/60 hover:text-red-400 disabled:opacity-40"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function titleOf(doc) {
  try {
    return JSON.parse(doc.metadata ?? "{}").title || doc.filename;
  } catch {
    return doc.filename;
  }
}
