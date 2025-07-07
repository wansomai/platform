import { createClient, Environment } from 'contentful-management';

export async function getEnvironment(): Promise<Environment> {
  const client = createClient({
    accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
  });

  const space = await client.getSpace(process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID!);
  return space.getEnvironment('master');
}
