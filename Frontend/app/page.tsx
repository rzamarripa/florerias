import Link from 'next/link';

export default function Page() {
  return (
    <div className="container">
      <div className="row justify-content-center align-items-center vh-100">
        <div className="col text-center">
          <h1 className="mb-4">Landing Page de la aplicación</h1>
          <Link href="/iniciar-sesion" className="btn btn-primary">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
