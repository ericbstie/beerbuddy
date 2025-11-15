import { toast as sonnerToast } from "sonner";

export const toast = {
	success: (
		message: string,
		options?: Parameters<typeof sonnerToast.success>[1],
	) => sonnerToast.success(message, options),
	error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) =>
		sonnerToast.error(message, options),
	info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) =>
		sonnerToast.info(message, options),
	loading: (
		message: string,
		options?: Parameters<typeof sonnerToast.loading>[1],
	) => sonnerToast.loading(message, options),
	promise: <T>(
		promise: Promise<T>,
		messages: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((error: Error) => string);
		},
	) => sonnerToast.promise(promise, messages),
};
