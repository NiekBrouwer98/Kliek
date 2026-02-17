import JSZip from 'jszip'

const GITHUB_OWNER = 'NiekBrouwer98'
const GITHUB_REPO = 'Kliek'
const EXTENSION_PATH = 'extension'

interface GitHubTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree'
  sha: string
  url?: string
}

interface GitHubTreeResponse {
  sha: string
  tree: GitHubTreeItem[]
}

interface GitHubBlobResponse {
  content: string
  encoding: string
}

export async function GET() {
  try {
    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/master`,
      { headers: { 'User-Agent': 'Kliek-Recipe-App', Accept: 'application/vnd.github.v3+json' } }
    )
    if (!commitRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch repo' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const commit = (await commitRes.json()) as { commit: { tree: { sha: string } } }
    const treeSha = commit.commit.tree.sha

    const treeRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${treeSha}?recursive=1`,
      { headers: { 'User-Agent': 'Kliek-Recipe-App', Accept: 'application/vnd.github.v3+json' } }
    )
    if (!treeRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch tree' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const treeData = (await treeRes.json()) as GitHubTreeResponse
    const extensionFiles = treeData.tree.filter(
      (item) => item.type === 'blob' && item.path.startsWith(EXTENSION_PATH + '/')
    )

    const zip = new JSZip()
    const extensionFolder = zip.folder(EXTENSION_PATH)!

    for (const file of extensionFiles) {
      const blobRes = await fetch(file.url!, {
        headers: { 'User-Agent': 'Kliek-Recipe-App', Accept: 'application/vnd.github.v3+json' },
      })
      if (!blobRes.ok) continue
      const blobData = (await blobRes.json()) as GitHubBlobResponse
      const content =
        blobData.encoding === 'base64'
          ? Buffer.from(blobData.content, 'base64')
          : Buffer.from(blobData.content, 'utf-8')
      const name = file.path.slice(EXTENSION_PATH.length + 1)
      extensionFolder.file(name, content)
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="kliek-extension.zip"',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to build extension zip'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
