// app/sitemap.js

export default async function sitemap() {
  const baseUrl = 'https://wansom.co';

  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/es`,
          de: `${baseUrl}/de`,
        },
      },
    },
    {
      url: `${baseUrl}/hire-a-lawyer`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/es/hire-a-lawyer`,
          de: `${baseUrl}/de/hire-a-lawyer`,
        },
      },
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/es/pricing`,
          de: `${baseUrl}/de/pricing`,
        },
      },
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/blogs`,
          de: `${baseUrl}/blogs`,
        },
      },
    },
    {
      url: `${baseUrl}/legal-templates`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/legal-templates`,
          de: `${baseUrl}/legal-templates`,
        },
      },
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/contact`,
          de: `${baseUrl}/contact`,
        },
      },
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/careers`,
          de: `${baseUrl}/careers`,
        },
      },
    },
  ];


  const routes = [...staticRoutes];

  return routes;
}
