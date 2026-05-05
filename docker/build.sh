#!/bin/bash

echo "========================================="
echo "  Build da imagem Docker"
echo "========================================="

docker build -t stock-sales-rn-dev .

echo ""
echo "✓ Imagem buildada com sucesso!"
echo ""
echo "Para rodar o container, use:"
echo "  ./docker/run.sh"