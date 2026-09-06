import { Composer } from "./composer";

export const metadata = { title: "Novo prompt" };

export default function AppHome() {
  return (
    <>
      <p className="eyebrow">Novo prompt</p>
      <h1 className="mt-3 font-heading text-2xl tracking-tight">
        Diz a intenção. O COTOR faz a engenharia.
      </h1>
      <div className="mt-8">
        <Composer />
      </div>
    </>
  );
}
