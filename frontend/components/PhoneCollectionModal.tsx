'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import LoadingSpinner from './LoadingSpinner';

interface PhoneCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PhoneCollectionModal({ isOpen, onClose }: PhoneCollectionModalProps) {
    const { updateProfile, user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            phone: ''
        }
    });

    const onSubmit = async (data: { phone: string }) => {
        setIsLoading(true);
        try {
            // Format phone number to E.164
            let formattedPhone = data.phone;
            if (/^\d{10}$/.test(data.phone)) {
                formattedPhone = `+91${data.phone}`;
            }

            await updateProfile({ phone: formattedPhone });
            toast.success('Phone number updated successfully!');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update phone number');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Phone Number Required
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        To continue using GoTogether, please provide your phone number. This helps us coordinate rides better.
                                    </p>

                                    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                                Phone Number
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    {...register('phone', {
                                                        required: 'Phone number is required',
                                                        pattern: {
                                                            value: /^[0-9]{10}$/,
                                                            message: 'Please enter a valid 10-digit phone number'
                                                        }
                                                    })}
                                                    type="tel"
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                    placeholder="9876543210"
                                                    maxLength={10}
                                                />
                                            </div>
                                            {errors.phone && (
                                                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                                            )}
                                        </div>

                                        <div className="mt-5 sm:mt-6">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                                            >
                                                {isLoading ? <LoadingSpinner size="sm" /> : 'Save Phone Number'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
