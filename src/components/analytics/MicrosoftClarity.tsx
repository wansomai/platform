'use client';

import { useEffect } from 'react';
import { clarity } from '@microsoft/clarity';

export default function MicrosoftClarity() {
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

    if (projectId && typeof window !== 'undefined') {
      clarity.init(projectId);
      console.log('Microsoft Clarity initialized with project ID:', projectId);
    }
  }, []);

  return null;
}
