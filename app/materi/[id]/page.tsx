interface Props {
  params: Promise<{ id: string }>;
}

export default async function MateriPage({ params }: Props) {
  const { id } = await params;
  
  return (
    <div>
      <h1>Materi {id}</h1>
    </div>
  );
}export const runtime = 'edge';
