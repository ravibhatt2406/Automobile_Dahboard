import { PartialType } from '@nestjs/swagger';
import { CreateComplianceDocDto } from './create-compliance-doc.dto';

export class UpdateComplianceDocDto extends PartialType(CreateComplianceDocDto) {}
