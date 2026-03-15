import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import { type Handle, redirect } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { env } from "$env/dynamic/private";

const ALLOWED_EMAILS = (env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

const { handle: authHandle } = SvelteKitAuth({
    trustHost: true,
    providers: [Google],
    callbacks: {
        signIn({ profile }) {
            if (!profile?.email) {
                return false;
            }
            if (ALLOWED_EMAILS.length === 0) {
                return true;
            }
            return ALLOWED_EMAILS.includes(profile.email);
        },
    },
});

const authGuard: Handle = async ({ event, resolve }) => {
    // Allow auth routes through
    if (event.url.pathname.startsWith("/auth")) {
        return resolve(event);
    }

    // Allow the login page through
    if (event.url.pathname === "/login") {
        return resolve(event);
    }

    const session = await event.locals.auth();

    if (!session?.user) {
        // API requests get 401 JSON
        if (event.url.pathname.startsWith("/api")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }
        // Page requests redirect to login
        throw redirect(303, "/login");
    }

    return resolve(event);
};

export const handle = sequence(authHandle, authGuard);
