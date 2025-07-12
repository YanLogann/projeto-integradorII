-- Criação das tabelas

CREATE TABLE produtos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    preco DECIMAL(10, 2),
    estoque INT
);

CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data_pedido DATE,
    id_produto INT,
    quantidade INT,
    FOREIGN KEY (id_produto) REFERENCES produtos(id)
);

-- Inserção de registros

INSERT INTO produtos (nome, preco, estoque) VALUES
('Café Expresso', 5.50, 50),
('Cappuccino', 7.00, 30),
('Pão de Queijo', 4.00, 100);

INSERT INTO pedidos (data_pedido, id_produto, quantidade) VALUES
('2025-07-10', 1, 2),
('2025-07-11', 2, 1),
('2025-07-12', 3, 4);
