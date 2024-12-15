import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export interface Formula {
    id?: number;
    name: string;
    latex: string;
    source: string;
    description: string;
    indexes?: number[];
}

export function useFormulas() {
    return useQuery({
        queryFn: async () => {
            return (await (await fetch("/api/formulas")).json()) as Formula[]
        },
        queryKey: ["formulas"]
    })
}

export function useCreateFormula() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (formula: Formula) => {
            fetch("/api/formulas", {
                method: "POST",
                body: JSON.stringify(formula),
                headers: { "Content-Type": "application/json" },
            })
        },
        mutationKey: ["formulas"],
        onSuccess: async () => {
            await client.invalidateQueries({ queryKey: ['formulas'] })
        }
    })
}