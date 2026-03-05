import { Separator } from "@/components/ui/separator"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function PoliticasPrivacidadPage() {
  return (
    <div className="landing-scope">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <h1
            className="text-4xl font-bold text-foreground mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Politicas de Privacidad
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
                Zolt es un sistema de gestion empresarial desarrollado por Masoft,
                disenado especificamente para florerias. La presente Politica de
                Privacidad describe como recopilamos, usamos, almacenamos y
                protegemos la informacion personal de nuestros usuarios, sus
                clientes y cualquier persona cuyos datos sean procesados a traves
                de nuestra plataforma.
              </p>
              <p className="mt-3">
                Al utilizar Zolt, aceptas las practicas descritas en esta politica.
                Te recomendamos leerla detenidamente.
              </p>
            </section>

            {/* 2. Datos que recopilamos */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                2. Datos que recopilamos
              </h2>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.1 Datos de usuarios y personal
              </h3>
              <p>
                Recopilamos informacion de los usuarios que acceden a la plataforma,
                incluyendo: nombre completo, correo electronico, numero de telefono,
                nombre de usuario, contrasena (almacenada de forma hasheada), foto
                de perfil y rol asignado dentro del sistema.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.2 Datos de clientes
              </h3>
              <p>
                La plataforma permite registrar informacion de los clientes de la
                floreria: nombre, numero de telefono, correo electronico (opcional),
                genero, numero de cliente, puntos del programa de lealtad,
                comentarios internos y fuente de marketing por la cual conocieron
                el negocio.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.3 Datos de pedidos y entregas
              </h3>
              <p>
                Para gestionar los pedidos se recopila: nombre del destinatario,
                direccion de entrega, fecha y hora de entrega, mensaje de
                dedicatoria, detalles del arreglo floral y estado del pedido.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.4 Datos financieros
              </h3>
              <p>
                Registramos el metodo de pago utilizado, montos de las transacciones
                y el estado de cada operacion. El procesamiento de pagos con tarjeta
                se realiza a traves de Stripe; Zolt no almacena directamente
                numeros de tarjeta de credito o debito.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-2">
                2.5 Datos de tarjetas digitales
              </h3>
              <p>
                Para el programa de lealtad, se generan tarjetas digitales que
                pueden incluir: serial de Apple Wallet, ID de Google Wallet, datos
                de codigo QR y tipo de dispositivo del usuario.
              </p>
            </section>

            {/* 3. Como usamos los datos */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                3. Como usamos los datos
              </h2>
              <p>Utilizamos la informacion recopilada para:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Gestion de pedidos:</span>{" "}
                  procesar, coordinar y dar seguimiento a los pedidos y entregas.
                </li>
                <li>
                  <span className="text-foreground font-medium">Comunicaciones:</span>{" "}
                  enviar confirmaciones, actualizaciones de estado y notificaciones
                  por correo electronico y WhatsApp.
                </li>
                <li>
                  <span className="text-foreground font-medium">Programa de lealtad:</span>{" "}
                  administrar puntos, generar tarjetas digitales y ofrecer
                  beneficios a los clientes frecuentes.
                </li>
                <li>
                  <span className="text-foreground font-medium">Mejora del servicio:</span>{" "}
                  analizar el uso de la plataforma para optimizar la experiencia
                  del usuario y las operaciones del negocio.
                </li>
              </ul>
            </section>

            {/* 4. Servicios de terceros */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                4. Servicios de terceros
              </h2>
              <p>
                Zolt se integra con los siguientes servicios de terceros para su
                operacion:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Resend:</span>{" "}
                  utilizado para el envio de correos electronicos transaccionales
                  (confirmaciones de pedido, notificaciones, etc.).
                </li>
                <li>
                  <span className="text-foreground font-medium">WhatsApp Business API / Meta:</span>{" "}
                  utilizado para enviar notificaciones y actualizaciones de pedidos
                  a clientes via WhatsApp.
                </li>
                <li>
                  <span className="text-foreground font-medium">Stripe:</span>{" "}
                  utilizado para el procesamiento seguro de pagos con tarjeta.
                  Stripe maneja directamente los datos sensibles de pago bajo sus
                  propias politicas de seguridad y cumplimiento PCI DSS.
                </li>
                <li>
                  <span className="text-foreground font-medium">Firebase:</span>{" "}
                  utilizado para el almacenamiento de archivos como imagenes de
                  productos y fotos de perfil.
                </li>
              </ul>
              <p className="mt-3">
                Cada uno de estos servicios opera bajo sus propias politicas de
                privacidad. Te recomendamos consultarlas para conocer como manejan
                la informacion.
              </p>
            </section>

            {/* 5. Seguridad de los datos */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                5. Seguridad de los datos
              </h2>
              <p>
                Implementamos medidas de seguridad para proteger la informacion
                almacenada en nuestra plataforma:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  Las contrasenas se almacenan hasheadas utilizando bcrypt, lo que
                  impide su lectura en texto plano.
                </li>
                <li>
                  Toda la transmision de datos se realiza a traves de conexiones
                  cifradas (HTTPS/TLS).
                </li>
                <li>
                  El acceso a la informacion esta controlado mediante un sistema de
                  roles y permisos que limita el acceso segun la funcion de cada
                  usuario.
                </li>
              </ul>
            </section>

            {/* 6. Retencion de datos */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                6. Retencion de datos
              </h2>
              <p>
                La informacion personal se conserva mientras la cuenta del usuario
                o la relacion comercial permanezca activa. Las tarjetas digitales
                del programa de lealtad tienen una vigencia de 1 ano a partir de
                su fecha de emision. Una vez que una cuenta se elimina o la relacion
                comercial finaliza, los datos personales se eliminan o anonimizan
                en un plazo razonable, salvo que exista una obligacion legal para
                conservarlos.
              </p>
            </section>

            {/* 7. Derechos del usuario */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                7. Derechos del usuario
              </h2>
              <p>
                De acuerdo con la Ley Federal de Proteccion de Datos Personales en
                Posesion de los Particulares (LFPDPPP) de Mexico, tienes derecho a:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <span className="text-foreground font-medium">Acceso:</span>{" "}
                  conocer que datos personales tenemos sobre ti y como los usamos.
                </li>
                <li>
                  <span className="text-foreground font-medium">Rectificacion:</span>{" "}
                  solicitar la correccion de tus datos si son inexactos o estan
                  incompletos.
                </li>
                <li>
                  <span className="text-foreground font-medium">Cancelacion:</span>{" "}
                  solicitar la eliminacion de tus datos personales de nuestros
                  registros.
                </li>
                <li>
                  <span className="text-foreground font-medium">Oposicion:</span>{" "}
                  oponerte al uso de tus datos para fines especificos.
                </li>
                <li>
                  <span className="text-foreground font-medium">Portabilidad:</span>{" "}
                  solicitar una copia de tus datos en un formato estructurado y de
                  uso comun.
                </li>
              </ul>
              <p className="mt-3">
                Para ejercer cualquiera de estos derechos (derechos ARCO), puedes
                contactarnos a traves de los medios indicados en la seccion de
                Contacto.
              </p>
            </section>

            {/* 8. Cookies y tecnologias */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                8. Cookies y tecnologias de rastreo
              </h2>
              <p>
                Zolt utiliza cookies de sesion estrictamente necesarias para el
                funcionamiento de la autenticacion y la gestion de sesiones de
                usuario. No utilizamos cookies de rastreo, publicidad o analitica
                de terceros.
              </p>
            </section>

            {/* 9. Contacto */}
            <section>
              <h2
                className="text-2xl font-semibold text-foreground mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                9. Contacto
              </h2>
              <p>
                Si tienes preguntas, dudas o deseas ejercer tus derechos
                relacionados con la privacidad de tus datos, puedes contactarnos
                a traves de:
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
