"use client";
import { Job, JobsTable } from "./jobs-table"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

function JobsPage() {
    let { data, isLoading, isError } = useQuery({
        queryFn: async () => {
            let res = await fetch('/api/jobs');
            return await res.json() as Job[];
        },
        queryKey: ["jobs"]
    })
    if (isLoading || isError)
        return null
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-5">Batch Processing Jobs</h1>
            <JobsTable jobs={data!}/>
        </div>
    )
}

export default function () {
    let client = new QueryClient();
    return (
        <QueryClientProvider client={client}>
            <JobsPage/>
        </QueryClientProvider>
    )
}
