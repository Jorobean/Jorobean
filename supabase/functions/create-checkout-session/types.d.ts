declare module 'https://esm.sh/@supabase/supabase-js@2.8.0' {
    export * from '@supabase/supabase-js';
}

declare module 'https://esm.sh/stripe@11.1.0?target=deno' {
    export * from 'stripe';
}

declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};
