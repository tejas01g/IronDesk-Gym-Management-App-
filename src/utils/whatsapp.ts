import { Linking } from 'react-native';

export interface WhatsAppTemplateParams {
  template: string;
  name: string;
  gym: string;
  expiry: string;
  amount: string;
  upiLink: string;
}

export function cleanIndianPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function formatWhatsAppMessage({
  template,
  name,
  gym,
  expiry,
  amount,
  upiLink,
}: WhatsAppTemplateParams): string {
  let message = template;
  message = message.replace(/{name}/g, name);
  message = message.replace(/{gym}/g, gym);
  message = message.replace(/{expiry}/g, expiry);
  message = message.replace(/{amount}/g, amount);
  message = message.replace(/{upi_link}/g, upiLink);
  return message;
}

export async function openWhatsApp(phone: string, text: string): Promise<boolean> {
  try {
    const cleanPhone = cleanIndianPhoneNumber(phone);
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/91${cleanPhone}?text=${encodedText}`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      await Linking.openURL(url);
      return true;
    }
  } catch (error) {
    console.warn('[WhatsApp] Could not open WhatsApp:', error);
    return false;
  }
}

export async function makePhoneCall(phone: string): Promise<boolean> {
  try {
    const cleanPhone = cleanIndianPhoneNumber(phone);
    const url = `tel:${cleanPhone}`;
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.warn('[PhoneCall] Could not make call:', error);
    return false;
  }
}
