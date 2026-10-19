import { Head, Link, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function Edit({ mapping, reportTypes, indicators }: any) {
  const f = useForm<any>({
    report_type_id: String(mapping.report_type_id),
    indicator_id: String(mapping.indicator_id),
    source_label: mapping.source_label,
    source_key: mapping.source_key ?? "",
    male_column: mapping.male_column ?? "",
    female_column: mapping.female_column ?? "",
    is_active: Boolean(mapping.is_active),
  });
  const submit = (e: any) => {
    e.preventDefault();
    f.put(`/justine/fhsis-import-mappings/${mapping.id}`);
  };
  const filtered = indicators.filter(
    (i: any) =>
      !f.data.report_type_id ||
      i.section?.report_type_id === Number(f.data.report_type_id)
  );
  return (
    <>
      <Head title="Edit FHSIS Mapping" />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit FHSIS Import Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submit}>
              <Field label="Report Type">
                <select
                  className="w-full rounded-md border p-2 bg-background"
                  value={f.data.report_type_id}
                  onChange={(e) => {
                    f.setData("report_type_id", e.target.value);
                    f.setData("indicator_id", "");
                  }}
                >
                  <option value="">Select report type</option>
                  {reportTypes.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.code} — {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Indicator">
                <select
                  className="w-full rounded-md border p-2 bg-background"
                  value={f.data.indicator_id}
                  onChange={(e) => f.setData("indicator_id", e.target.value)}
                >
                  <option value="">Select indicator</option>
                  {filtered.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.code} — {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Source Label">
                <Input
                  value={f.data.source_label}
                  onChange={(e) => f.setData("source_label", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Male Excel Column">
                  <Input
                    type="number"
                    value={f.data.male_column}
                    onChange={(e) => f.setData("male_column", e.target.value)}
                  />
                </Field>
                <Field label="Female Excel Column">
                  <Input
                    type="number"
                    value={f.data.female_column}
                    onChange={(e) => f.setData("female_column", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Source Key">
                <Input
                  value={f.data.source_key}
                  onChange={(e) => f.setData("source_key", e.target.value)}
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline">
                  <Link href="/justine/fhsis-import-mappings">Cancel</Link>
                </Button>
                <Button disabled={f.processing}>Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
function Field({ label, children }: { label: string; children: any }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
