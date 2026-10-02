import { z } from 'zod';
import { isProvinceCode, type ProvinceCode } from './provinces';

const provinceCodeSchema = z
  .string()
  .refine((value): value is ProvinceCode => isProvinceCode(value), {
    message: 'รหัสจังหวัดไม่ถูกต้อง',
  });

export const technicianInputSchema = z.object({
  code: z.string().trim().min(1, 'กรุณาใส่รหัสช่าง').max(20),
  nickname: z.string().trim().min(1, 'กรุณาใส่ชื่อเล่น').max(50),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, 'เบอร์โทรใช้ได้เฉพาะตัวเลข + - และเว้นวรรค'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'สีต้องเป็นรูปแบบ #RRGGBB'),
  baseProvinces: z.array(provinceCodeSchema).max(77),
  serviceProvinces: z.array(provinceCodeSchema).max(77),
});

export const technicianSchema = technicianInputSchema.extend({
  id: z.string().min(1),
  updatedAt: z.string().datetime(),
  updatedBy: z.string(),
});

export type TechnicianInput = z.infer<typeof technicianInputSchema>;
export type Technician = z.infer<typeof technicianSchema>;