import { PostForm } from '../../PostForm'

export const metadata = {
  title: '编辑文章 - WebCoding 作品聚合平台',
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <PostForm postId={id} />
}
