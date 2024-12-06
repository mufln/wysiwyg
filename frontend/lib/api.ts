import { useMutation, useQuery } from "@tanstack/react-query";

export interface Formula {
    id?: number;
    name: string;
    latex: string;
    source: string;
}

export function useFormulas() {
    return useQuery({
        queryFn: async () => {
            return (await (await fetch(process.env["NEXT_PUBLIC_API_URL"] + "/formulas")).json()) as Formula[]
        },
        queryKey: ["formulas"]
    })
}

export function useCreateFormula() {
    return useMutation({
        mutationFn: async (formula: Formula) => {
            fetch(process.env["NEXT_PUBLIC_API_URL"] + "/formulas", {
                method: "POST",
                body: JSON.stringify(formula),
                headers: { "Content-Type": "application/json" },
            })
        }
    })
}