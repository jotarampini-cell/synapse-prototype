#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Synapse en modo desarrollo...\n');

// Verificar si existe el archivo .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
	console.log('⚠️  Archivo .env.local no encontrado');
	console.log('🔧 Ejecutando configuración automática...\n');
	
	// Ejecutar setup-env.js
	const setupProcess = spawn('node', ['setup-env.js'], {
		cwd: path.join(__dirname, '..'),
		stdio: 'inherit'
	});
	
	setupProcess.on('close', (code) => {
		if (code === 0) {
			console.log('\n✅ Configuración completada');
			startDevServer();
		} else {
			console.error('\n❌ Error en la configuración');
			process.exit(1);
		}
	});
} else {
	console.log('✅ Archivo .env.local encontrado');
	startDevServer();
}

function startDevServer() {
	console.log('\n🔄 Iniciando servidor de desarrollo...\n');
	
	// Matar procesos de Node.js existentes
	const killProcess = spawn('taskkill', ['/f', '/im', 'node.exe'], {
		stdio: 'ignore'
	});
	
	killProcess.on('close', () => {
		// Iniciar el servidor de desarrollo
		const devProcess = spawn('npm', ['run', 'dev'], {
			cwd: path.join(__dirname, '..'),
			stdio: 'inherit',
			shell: true
		});
		
		devProcess.on('close', (code) => {
			console.log(`\n🛑 Servidor detenido con código: ${code}`);
		});
		
		// Manejar Ctrl+C
		process.on('SIGINT', () => {
			console.log('\n🛑 Deteniendo servidor...');
			devProcess.kill('SIGINT');
		});
	});
}




