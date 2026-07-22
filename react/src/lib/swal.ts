import Swal from 'sweetalert2';

export const showSuccess = (title: string, msg?: string) => {
  Swal.fire({ icon: 'success', title, text: msg, timer: 2000, showConfirmButton: false });
};

export const showError = (title: string, msg?: string) => {
  Swal.fire({ icon: 'error', title, text: msg, confirmButtonText: 'Entendido', confirmButtonColor: '#DA291C' });
};

export const showWarning = (title: string, msg?: string) => {
  Swal.fire({ icon: 'warning', title, text: msg, confirmButtonText: 'Entendido', confirmButtonColor: '#DA291C' });
};

export const confirmAction = async (title: string, msg: string): Promise<boolean> => {
  const result = await Swal.fire({
    title, text: msg, icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar', confirmButtonColor: '#DA291C',
  });
  return result.isConfirmed;
};
