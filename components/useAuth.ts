"use client";

import { useEffect, useState } from "react";
import { fetchSession } from "@/lib/auth";

export type Session = {
    loading: boolean
    authenticated: boolean
    name: string | null
    picture: string | null
}

export function useAuth(): Session {
    const [session, setSession] = useState<Session>({
        loading: true,
        authenticated: false,
        name: null,
        picture: null,
    })

    useEffect(() => {
        fetchSession().then((data) => {
            console.log("Session data:", data)
            if ("authenticated" in data && data.authenticated == "true") {
                setSession({
                    loading: false,
                    authenticated: true,
                    name: data.name,
                    picture: data.picture,
                })
            } else {
                setSession({
                    loading: false,
                    authenticated: false,
                    name: null,
                    picture: null,
                })
            }
        })
    }, [])

    return session
}
