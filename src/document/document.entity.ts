import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  filePath: string; // Caminho do arquivo no servidor ou S3, etc.

  @Column()
  status: string; // Pode ser "pendente" ou "assinado"

  @Column({ nullable: true })
  signDate: Date; // Data da assinatura

  @Column({ nullable: true })
  signers: string; // Lista de signatários, pode ser uma string separada por vírgulas
}
