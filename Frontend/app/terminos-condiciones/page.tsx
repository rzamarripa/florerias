import { Separator } from "@/components/ui/separator"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function TerminosCondicionesPage() {
  return (
    <div className="landing-scope">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <h1
            className="text-4xl font-bold text-foreground mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Terminos y Condiciones
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
                Los presentes Terminos y Condiciones regulan el uso de Zolt,
                una plataforma de gestion empresarial disenada especificamente
                para florerias, desarrollada y operada por Masoft. Al acceder o
                utilizar la plataforma, aceptas cumplir con estos terminos en
                su totalidad.
              </p>
            </section>

            {/* 2. Definiciones */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                2. Definiciones
              </h2>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Plataforma:</span>{" "}
                  se refiere a Zolt, incluyendo todas sus funcionalidades,
                  modulos y servicios asociados.
                </li>
                <li>
                  <span className="text-foreground font-medium">Usuario:</span>{" "}
                  toda persona que cuente con una cuenta activa en la
                  plataforma y acceda a sus funcionalidades.
                </li>
                <li>
                  <span className="text-foreground font-medium">Cliente:</span>{" "}
                  el cliente final de la floreria cuyos datos son gestionados a
                  traves de la plataforma.
                </li>
                <li>
                  <span className="text-foreground font-medium">Empresa:</span>{" "}
                  la floreria u organizacion que se suscribe a Zolt para
                  gestionar sus operaciones.
                </li>
                <li>
                  <span className="text-foreground font-medium">Masoft:</span>{" "}
                  el desarrollador y operador de la plataforma Zolt.
                </li>
              </ul>
            </section>

            {/* 3. Aceptacion de los terminos */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                3. Aceptacion de los terminos
              </h2>
              <p>
                Al crear una cuenta, acceder o utilizar cualquier
                funcionalidad de Zolt, confirmas que has leido, comprendido y
                aceptado estos Terminos y Condiciones. Si no estas de acuerdo
                con alguno de los terminos aqui descritos, debes abstenerte de
                utilizar la plataforma.
              </p>
            </section>

            {/* 4. Descripcion del servicio */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                4. Descripcion del servicio
              </h2>
              <p>
                Zolt es una plataforma integral de gestion empresarial que
                ofrece las siguientes funcionalidades:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Gestion de pedidos y seguimiento de entregas</li>
                <li>Administracion de inventario y productos</li>
                <li>Gestion de clientes y directorio de contactos</li>
                <li>Programa de lealtad con tarjetas digitales</li>
                <li>Generacion de reportes y estadisticas</li>
                <li>
                  Integraciones con servicios de terceros como Stripe
                  (pagos), WhatsApp Business (comunicaciones), Resend (correo
                  electronico) y Firebase (almacenamiento)
                </li>
              </ul>
            </section>

            {/* 5. Cuentas y acceso */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                5. Cuentas y acceso
              </h2>
              <p>
                Cada usuario recibe credenciales unicas para acceder a la
                plataforma. El acceso esta basado en un sistema de roles que
                incluye: gerente, cajero, redes y repartidor, cada uno con
                permisos especificos.
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  Es responsabilidad del usuario mantener la confidencialidad
                  de su contrasena y credenciales de acceso.
                </li>
                <li>
                  La empresa es responsable de gestionar las cuentas de sus
                  usuarios, incluyendo la creacion, modificacion y eliminacion
                  de las mismas.
                </li>
                <li>
                  Cualquier actividad realizada con las credenciales de un
                  usuario se considerara como realizada por dicho usuario.
                </li>
              </ul>
            </section>

            {/* 6. Uso aceptable */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                6. Uso aceptable
              </h2>
              <p>
                Al utilizar Zolt, te comprometes a:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  No compartir tus credenciales de acceso con terceros no
                  autorizados.
                </li>
                <li>
                  No intentar acceder a datos de otras empresas o usuarios sin
                  autorizacion.
                </li>
                <li>
                  No utilizar la plataforma para fines ilegales o contrarios a
                  la legislacion mexicana vigente.
                </li>
                <li>
                  No manipular de forma fraudulenta el programa de lealtad,
                  incluyendo la generacion artificial de puntos o el uso
                  indebido de tarjetas digitales.
                </li>
                <li>
                  No realizar ingenieria inversa, descompilar o intentar
                  extraer el codigo fuente de la plataforma.
                </li>
              </ul>
            </section>

            {/* 7. Propiedad intelectual */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                7. Propiedad intelectual
              </h2>
              <p>
                Zolt, incluyendo su codigo fuente, diseno, marca, logotipos y
                todo el contenido generado por Masoft, son propiedad exclusiva
                de Masoft y estan protegidos por las leyes de propiedad
                intelectual aplicables.
              </p>
              <p className="mt-3">
                Los datos, informacion y contenido ingresados por la empresa y
                sus usuarios a traves de la plataforma son y permanecen
                propiedad de la empresa. Masoft no reclamara derechos sobre
                dichos datos.
              </p>
            </section>

            {/* 8. Pagos y facturacion */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                8. Pagos y facturacion
              </h2>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  Los pagos de suscripcion y transacciones se procesan a traves
                  de Stripe, un proveedor de pagos certificado PCI DSS.
                </li>
                <li>
                  Masoft no almacena directamente numeros de tarjeta de credito
                  o debito; esta informacion es gestionada exclusivamente por
                  Stripe.
                </li>
                <li>
                  Es responsabilidad de la empresa mantener su suscripcion
                  activa y al corriente para garantizar el acceso continuo a la
                  plataforma.
                </li>
              </ul>
            </section>

            {/* 9. Programa de lealtad */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                9. Programa de lealtad
              </h2>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  Los puntos del programa de lealtad son un beneficio otorgado
                  por la empresa a sus clientes y no tienen valor monetario
                  fuera del contexto del programa.
                </li>
                <li>
                  Masoft proporciona la herramienta tecnologica para gestionar
                  el programa, pero no es responsable del canje, acumulacion o
                  disputas relacionadas con los puntos.
                </li>
                <li>
                  Las tarjetas digitales emitidas para Apple Wallet y Google
                  Wallet tienen una vigencia de 1 ano a partir de su fecha de
                  emision.
                </li>
              </ul>
            </section>

            {/* 10. Integraciones con terceros */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                10. Integraciones con terceros
              </h2>
              <p>
                Zolt se integra con servicios de terceros para ofrecer
                funcionalidades extendidas. Masoft no se responsabiliza por:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  Interrupciones, cambios o discontinuacion de los servicios
                  proporcionados por Stripe, Meta/WhatsApp, Resend o Firebase.
                </li>
                <li>
                  Cambios en las politicas, terminos o precios de dichos
                  servicios de terceros.
                </li>
                <li>
                  Perdida de datos o funcionalidad derivada de cambios en las
                  APIs o condiciones de servicio de terceros.
                </li>
              </ul>
            </section>

            {/* 11. Limitacion de responsabilidad */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                11. Limitacion de responsabilidad
              </h2>
              <p>
                Zolt se ofrece &ldquo;tal cual&rdquo; y &ldquo;segun
                disponibilidad&rdquo;. Masoft no garantiza que el servicio sera
                ininterrumpido, libre de errores o completamente seguro.
              </p>
              <p className="mt-3">
                En la medida permitida por la legislacion aplicable, Masoft no
                sera responsable por perdidas comerciales, lucro cesante, danos
                indirectos o consecuentes derivados del uso o la imposibilidad
                de uso de la plataforma, incluyendo fallos del sistema,
                interrupciones del servicio o perdida de datos.
              </p>
            </section>

            {/* 12. Modificaciones a los terminos */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                12. Modificaciones a los terminos
              </h2>
              <p>
                Masoft se reserva el derecho de actualizar o modificar estos
                Terminos y Condiciones en cualquier momento. Cuando se realicen
                cambios significativos, se notificara a los usuarios a traves
                de la plataforma.
              </p>
              <p className="mt-3">
                El uso continuado de Zolt despues de la publicacion de los
                terminos actualizados implica la aceptacion de los mismos.
              </p>
            </section>

            {/* 13. Legislacion aplicable */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                13. Legislacion aplicable
              </h2>
              <p>
                Estos Terminos y Condiciones se rigen por las leyes vigentes de
                los Estados Unidos Mexicanos. Cualquier controversia derivada
                del uso de la plataforma sera sometida a la jurisdiccion de los
                tribunales competentes en Mexico.
              </p>
            </section>

            {/* 14. Contacto */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                14. Contacto
              </h2>
              <p>
                Si tienes preguntas o comentarios sobre estos Terminos y
                Condiciones, puedes contactarnos a traves de:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Empresa:</span>{" "}
                  Masoft
                </li>
                <li>
                  <span className="text-foreground font-medium">Correo electronico:</span>{" "}
                  contacto@masoft.mx
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
