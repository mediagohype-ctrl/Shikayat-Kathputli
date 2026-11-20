import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, Download, Phone } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ComplaintEditor from "@/components/admin/ComplaintEditor";
import MediaGallery from "@/components/admin/MediaGallery";
import StatusBadge from "@/components/admin/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getComplaintWithUrls } from "@/lib/admin-queries";
import { CATEGORY_LABEL } from "@/lib/categories";
import { formatIST } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const result = await getComplaintWithUrls(id);
  if (!result) notFound();
  const { complaint: c, media, voice } = result;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All complaints
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{c.complaint_no}</h1>
          <StatusBadge status={c.status} />
          <span className="text-sm text-muted">{formatIST(c.created_at)}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resident</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[120px_1fr] gap-y-2">
                  <dt className="text-muted">Name</dt>
                  <dd className="font-semibold break-words">{c.name}</dd>
                  <dt className="text-muted">Mobile</dt>
                  <dd>
                    <a href={`tel:+91${c.mobile}`} className="inline-flex items-center gap-1 font-semibold text-primary">
                      <Phone className="h-4 w-4" aria-hidden /> +91 {c.mobile}
                    </a>
                  </dd>
                  <dt className="text-muted">House / camp</dt>
                  <dd className="font-semibold break-words">{c.house_no}</dd>
                  <dt className="text-muted">Problem</dt>
                  <dd className="flex flex-wrap gap-1">
                    {c.categories.map((k) => (
                      <Badge key={k} variant="outline">
                        {CATEGORY_LABEL[k] ?? k}
                      </Badge>
                    ))}
                  </dd>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {c.description ? (
                  <p className="whitespace-pre-wrap break-words text-base" lang="hi">
                    {c.description}
                  </p>
                ) : (
                  <p className="text-muted">No typed description.</p>
                )}
                {voice && (
                  <div>
                    <p className="mb-1 text-sm font-semibold">🎤 Voice note</p>
                    {voice.url ? (
                      <>
                        <audio controls preload="metadata" src={voice.url} className="w-full" />
                        {voice.downloadUrl && (
                          <a href={voice.downloadUrl} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary" download>
                            <Download className="h-4 w-4" aria-hidden /> Download voice note
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-danger">Voice file not found in storage.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Photos / videos</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaGallery items={media} />
              </CardContent>
            </Card>
          </div>

          <ComplaintEditor
            id={c.id}
            complaintNo={c.complaint_no}
            mobile={c.mobile}
            initialStatus={c.status}
            initialNote={c.admin_note ?? ""}
            updatedAt={c.updated_at}
          />
        </div>
      </main>
    </>
  );
}
