"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addBike } from "@/lib/actions/garage";
import { toast } from "sonner";

interface BikeSelectorProps {
  makes: string[];
  getModels: (make: string) => Promise<string[]>;
  getYears: (make: string, model: string) => Promise<number[]>;
  getBikeId: (
    make: string,
    model: string,
    year: number,
  ) => Promise<string | null>;
}

export function BikeSelector({
  makes,
  getModels,
  getYears,
  getBikeId,
}: BikeSelectorProps) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleMakeChange = async (value: string) => {
    setMake(value);
    setModel("");
    setYear("");
    setYears([]);
    const m = await getModels(value);
    setModels(m);
  };

  const handleModelChange = async (value: string) => {
    setModel(value);
    setYear("");
    const y = await getYears(make, value);
    setYears(y);
  };

  const handleAdd = () => {
    if (!make || !model || !year) return;
    startTransition(async () => {
      const bikeId = await getBikeId(make, model, Number(year));
      if (!bikeId) {
        toast.error("Μηχανή δεν βρέθηκε");
        return;
      }
      const result = await addBike({ bikeId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Η μηχανή προστέθηκε στο γκαράζ σου!");
      setMake("");
      setModel("");
      setYear("");
      setModels([]);
      setYears([]);
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Πρόσθεσε τη μηχανή σου</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={make}
          onChange={(e) => handleMakeChange(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Μάρκα</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={!make}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          <option value="">Μοντέλο</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          disabled={!model}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          <option value="">Έτος</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleAdd}
        disabled={!year || isPending}
        className="w-full sm:w-auto"
      >
        {isPending ? "Προσθήκη..." : "Προσθήκη στο Γκαράζ"}
      </Button>
    </div>
  );
}
