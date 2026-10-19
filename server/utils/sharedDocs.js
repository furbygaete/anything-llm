const prisma = require("./prisma");

/**
 * Sabia: documents stored under the `shared/` library folder are company-wide.
 * Every workspace gets them: new workspaces receive all of them on creation,
 * and adding a shared document to any workspace fans it out to all others.
 * Embeddings are cached per document, so the fan-out is cheap.
 *
 * ponytail: fan-out runs inline in the request; move to a job if a customer
 * has hundreds of workspaces.
 */
const SHARED_FOLDER = "shared";
const SHARED_PREFIX = `${SHARED_FOLDER}/`;

function isSharedDoc(docpath = "") {
  return String(docpath).startsWith(SHARED_PREFIX);
}

/** Every distinct shared docpath embedded in at least one workspace. */
async function sharedDocPaths() {
  const rows = await prisma.workspace_documents.findMany({
    where: { docpath: { startsWith: SHARED_PREFIX } },
    select: { docpath: true },
    distinct: ["docpath"],
  });
  return rows.map((row) => row.docpath);
}

/** Embed into `workspace` whichever of `paths` (default: all shared docs) it lacks. */
async function syncSharedDocs(workspace, paths = null) {
  const { Document } = require("../models/documents");
  const wanted = paths ?? (await sharedDocPaths());
  if (wanted.length === 0) return;
  const have = new Set(
    (await Document.forWorkspace(workspace.id)).map((doc) => doc.docpath)
  );
  const missing = wanted.filter((path) => !have.has(path));
  if (missing.length === 0) return;
  await Document.addDocuments(workspace, missing, null, { propagate: false });
}

/** After `paths` were embedded into one workspace, copy the shared ones everywhere else. */
async function propagateSharedDocs(paths = [], fromWorkspaceId = null) {
  const shared = paths.filter(isSharedDoc);
  if (shared.length === 0) return;
  const { Workspace } = require("../models/workspace");
  const others = await Workspace.where({ id: { not: fromWorkspaceId } });
  for (const workspace of others) await syncSharedDocs(workspace, shared);
}

module.exports = {
  SHARED_FOLDER,
  isSharedDoc,
  sharedDocPaths,
  syncSharedDocs,
  propagateSharedDocs,
};
