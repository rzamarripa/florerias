/**
 * Establece mensajes de validación personalizados en español para campos de formulario HTML5
 * @param e - Evento de invalidación del input
 */
export const setCustomValidationMessage = (
  e: React.InvalidEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
): void => {
  const input = e.target;

  if (input.validity.valueMissing) {
    input.setCustomValidity("Este campo es obligatorio");
  } else if (input.validity.typeMismatch) {
    if (input.type === "email") {
      input.setCustomValidity("Por favor ingresa un correo electrónico válido");
    } else if (input.type === "tel") {
      input.setCustomValidity("Por favor ingresa un número de teléfono válido");
    } else if (input.type === "url") {
      input.setCustomValidity("Por favor ingresa una URL válida");
    } else {
      input.setCustomValidity("Por favor ingresa un valor válido");
    }
  } else if (input.validity.patternMismatch) {
    input.setCustomValidity("El formato ingresado no es válido");
  } else if (input.validity.rangeUnderflow) {
    input.setCustomValidity(`La fecha debe ser mayor o igual a ${input.min}`);
  } else if (input.validity.rangeOverflow) {
    input.setCustomValidity(`El valor debe ser menor o igual a ${input.max}`);
  } else if (input.validity.stepMismatch) {
    input.setCustomValidity(`El valor no es válido para este campo`);
  } else if (input.validity.tooShort) {
    input.setCustomValidity(
      `El texto debe tener al menos ${input.minLength} caracteres`
    );
  } else if (input.validity.tooLong) {
    input.setCustomValidity(
      `El texto no puede exceder ${input.maxLength} caracteres`
    );
  } else {
    input.setCustomValidity("");
  }
};

/**
 * Resetea el mensaje de validación personalizado cuando el usuario empieza a escribir
 * @param e - Evento de cambio del input
 */
export const resetCustomValidationMessage = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
): void => {
  e.target.setCustomValidity("");
};
