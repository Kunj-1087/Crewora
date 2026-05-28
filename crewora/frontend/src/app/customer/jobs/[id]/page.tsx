import JobDetailsClient from './JobDetailsClient';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function JobDetailsPage() {
  return <JobDetailsClient />;
}

