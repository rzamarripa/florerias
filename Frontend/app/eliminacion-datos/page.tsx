import { Separator } from "@/components/ui/separator"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function EliminacionDatosPage() {
  return (
    <div className="landing-scope">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <h1
            className="text-4xl font-bold text-foreground mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Solicitud de Eliminacion de Datos
          </h1>
          <p className="text-muted-foreground mb-6">
            Ultima actualizacion: Marzo 2026
          </p>
          <Separator className="mb-12" />

          <div className="space-y-10 text-muted-foreground leading-relaxed">
            {/* 1. Introduccion */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                1. Introduccion
              </h2>
              <p>
                En Masoft, desarrolladores de Zolt, respetamos tu derecho a
                solicitar la eliminacion de tus datos personales conforme a la
                Ley Federal de Proteccion de Datos Personales en Posesion de
                los Particulares (LFPDPPP). Esta pagina describe que datos
                pueden eliminarse, como solicitarlo y que efectos tendra en tu
                cuenta.
              </p>
            </section>

            {/* 2. Que datos pueden eliminarse */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                2. Que datos pueden eliminarse
              </h2>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.1 Datos de cuenta de usuario
              </h3>
              <p>
                Nombre completo, correo electronico, numero de telefono, foto
                de perfil y credenciales de acceso asociadas a tu cuenta en la
                plataforma.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.2 Datos de clientes registrados
              </h3>
              <p>
                Nombre, informacion de contacto, historial de puntos del
                programa de lealtad y comentarios internos asociados a un
                perfil de cliente.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.3 Datos de pedidos asociados
              </h3>
              <p>
                Historial de pedidos, direcciones de entrega y mensajes de
                dedicatoria vinculados a tu cuenta o perfil de cliente.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.4 Tarjetas digitales de lealtad
              </h3>
              <p>
                Registros de tarjetas emitidas para Apple Wallet y Google
                Wallet, codigos QR asociados y datos de vinculacion con
                dispositivos.
              </p>
            </section>

            {/* 3. Datos que podrian retenerse */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                3. Datos que podrian retenerse
              </h2>
              <p>
                Algunos datos podrian no ser eliminados de forma inmediata
                debido a obligaciones legales:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Datos financieros y transaccionales:</span>{" "}
                  registros requeridos por obligaciones fiscales y legales
                  mexicanas (SAT, CFDI) que deben conservarse por los plazos
                  establecidos en la legislacion vigente.
                </li>
                <li>
                  <span className="text-foreground font-medium">Datos anonimizados:</span>{" "}
                  informacion que ha sido despersonalizada y se utiliza
                  unicamente para estadisticas internas y mejora del servicio,
                  sin posibilidad de identificar al titular.
                </li>
              </ul>
            </section>

            {/* 4. Como solicitar la eliminacion */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                4. Como solicitar la eliminacion
              </h2>
              <p>
                Para solicitar la eliminacion de tus datos personales, sigue
                estos pasos:
              </p>
              <ol className="list-decimal pl-6 mt-3 space-y-2">
                <li>
                  Envia un correo electronico a{" "}
                  <span className="text-foreground font-medium">privacidad@masoft.mx</span>{" "}
                  con el asunto &ldquo;Solicitud de eliminacion de datos&rdquo;.
                </li>
                <li>
                  Incluye en el correo tu nombre completo, el correo
                  electronico asociado a tu cuenta y una descripcion de los
                  datos que deseas eliminar.
                </li>
                <li>
                  Recibiras una confirmacion de recepcion dentro de los
                  siguientes 5 dias habiles.
                </li>
                <li>
                  La solicitud sera procesada y resuelta en un plazo maximo de
                  20 dias habiles conforme a lo establecido por la LFPDPPP.
                </li>
              </ol>
            </section>

            {/* 5. Proceso de verificacion */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                5. Proceso de verificacion
              </h2>
              <p>
                Antes de proceder con la eliminacion de datos, verificaremos la
                identidad del solicitante para garantizar que la solicitud
                proviene del titular de los datos o de un representante
                legalmente autorizado. Podemos solicitar informacion adicional
                para completar este proceso de verificacion.
              </p>
            </section>

            {/* 6. Efectos de la eliminacion */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                6. Efectos de la eliminacion
              </h2>
              <p>
                Es importante que consideres los siguientes efectos antes de
                solicitar la eliminacion de tus datos:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Perdida de acceso:</span>{" "}
                  tu cuenta sera desactivada permanentemente y no podras
                  iniciar sesion en la plataforma.
                </li>
                <li>
                  <span className="text-foreground font-medium">Puntos de lealtad:</span>{" "}
                  los puntos acumulados en el programa de lealtad seran
                  eliminados de forma definitiva.
                </li>
                <li>
                  <span className="text-foreground font-medium">Tarjetas digitales:</span>{" "}
                  las tarjetas emitidas para Apple Wallet y Google Wallet seran
                  desactivadas y dejaran de funcionar.
                </li>
                <li>
                  <span className="text-foreground font-medium">Datos irrecuperables:</span>{" "}
                  una vez completada la eliminacion, los datos no podran ser
                  recuperados.
                </li>
              </ul>
            </section>

            {/* 7. Eliminacion automatica */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                7. Eliminacion automatica
              </h2>
              <p>
                Adicionalmente a las solicitudes manuales, Zolt aplica
                politicas de eliminacion automatica:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  Las tarjetas digitales del programa de lealtad tienen una
                  vigencia de 1 ano a partir de su fecha de emision y expiran
                  automaticamente al finalizar dicho periodo.
                </li>
                <li>
                  Las cuentas de usuario que permanezcan inactivas por mas de 2
                  anos pueden ser eliminadas automaticamente, previo aviso al
                  correo electronico registrado.
                </li>
              </ul>
            </section>

            {/* 8. Contacto */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                8. Contacto
              </h2>
              <p>
                Si tienes preguntas sobre el proceso de eliminacion de datos o
                necesitas asistencia, puedes contactarnos a traves de:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Empresa:</span>{" "}
                  Masoft
                </li>
                <li>
                  <span className="text-foreground font-medium">Correo electronico:</span>{" "}
                  privacidad@masoft.mx
                </li>
                <li>
                  <span className="text-foreground font-medium">Plataforma:</span>{" "}
                  Zolt — Sistema de Gestion Empresarial para Florerias
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
