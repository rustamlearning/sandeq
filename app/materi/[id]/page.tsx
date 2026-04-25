import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default function MateriPage({ params }: Props) {
  return (
    <div>
      <h1>Materi {params.id}</h1>
    </div>
  );
}