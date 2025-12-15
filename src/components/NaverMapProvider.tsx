'use client';

import { NavermapsProvider } from 'react-naver-maps';
import { ReactNode } from 'react';

export default function NaverMapProviderWrapper({ children }: { children: ReactNode }) {
    const ncpClientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

    if (!ncpClientId) {
        console.error('Naver Client ID is missing in environment variables');
        return <>{children}</>;
    }

    return (
        <NavermapsProvider
            ncpClientId={ncpClientId}
            // You can add submodules here like 'geocoder' if needed later
            submodules={['geocoder']}
        >
            {children}
        </NavermapsProvider>
    );
}
