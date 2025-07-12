# Projeto Integrador II - Sistema para Cafeteria

Este repositório contém a modelagem e o script SQL para um sistema simples de gerenciamento de uma cafeteria. O projeto foi desenvolvido como atividade prática da disciplina, integrando os conceitos de modelagem de banco de dados e controle de versão com Git.

## 📦 Estrutura do banco de dados

O banco de dados possui duas tabelas principais:

### Tabela `produtos`
- `id` (INT, PK, AUTO_INCREMENT)
- `nome` (VARCHAR)
- `preco` (DECIMAL)
- `estoque` (INT)

### Tabela `pedidos`
- `id` (INT, PK, AUTO_INCREMENT)
- `data_pedido` (DATE)
- `id_produto` (INT, FK para `produtos`)
- `quantidade` (INT)

## 💾 Script SQL

O script `script.sql` contém:
- Comandos de criação das tabelas
- Inserção de registros de exemplo

## 🔄 Controle de Versão

Este projeto está versionado com Git, com commits significativos e comentários claros sobre as alterações feitas.

## 🔗 Link para o repositório

[https://github.com/YanLogann/projeto-integradorII](https://github.com/YanLogann/projeto-integradorII)
