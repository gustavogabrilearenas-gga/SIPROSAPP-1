import dynamic from 'next/dynamic';

export function dynamicComponent(componentPath: string) {
  return dynamic(() => import(componentPath), {
    loading: () => null,
    ssr: false
  });
}