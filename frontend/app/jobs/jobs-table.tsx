"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, XCircle, Archive } from 'lucide-react'
import {useMutation, useQueryClient} from "@tanstack/react-query";

type JobStatus = "pnd" | "prc" | "suc" | "err"

export interface Job {
  id: number
  status: JobStatus
  datetime: string
}

function nameFromShorthand(s: "pnd" | "prc" | "suc" | "err"): string {
  switch (s) {
    case "pnd":
      return "Ожидание очереди"
    case "prc":
      return "В обработке"
    case "suc":
      return "Обработано успешно"
    case "err":
      return "Во время обработки произошла ошибка"
    default:
      return "Неизвестное состояние";
  }
}
export function JobsTable({jobs}: {jobs: Job[]}) {
  const client = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("")
  const archiveJob = useMutation({
    mutationKey: ["jobs"],
    mutationFn: async(job_id: number) => {
      await fetch(`/api/jobs/archive/${job_id}`, {
        method: 'POST'
      })
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['jobs'] })
    }
  })

  // const filteredJobs = jobs.filter((job) =>
  //   job.id.toString().includes(searchTerm) && !job.archived
  // )

  const handleAction = async (id: number, action: "start" | "stop" | "archive") => {
    if (action == "archive")
      await archiveJob.mutateAsync(id)
  }

  const getStatusColor = (status: JobStatus): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "prc":
        return "default"
      case "pnd":
        return "secondary"
      case "err":
        return "destructive"
      case "suc":
        return "default"
    }
  }

  return (
    <div>
      <Input
        placeholder="Search job IDs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm mb-4"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.id}</TableCell>
              <TableCell>
                <Badge variant={getStatusColor(job.status)}>
                  {nameFromShorthand(job.status)}
                </Badge>
              </TableCell>
              <TableCell>{(new Date(job.datetime)).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(job.id, "start")}
                    disabled={job.status === "prc" || job.status === "suc"}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(job.id, "stop")}
                    disabled={job.status === "suc" || job.status === "err"}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(job.id, "archive")}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

