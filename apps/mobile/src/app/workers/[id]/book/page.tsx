import BookWorkerClient from './BookWorkerClient';

export async function generateStaticParams() {
  return [
    { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
    { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' },
    { id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' },
    { id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a' },
    { id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b' }
  ];
}

export default function BookWorkerPage() {
  return <BookWorkerClient />;
}
