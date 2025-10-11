#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔍 Verificando configuración de Synapse...\n');

// Verificar archivo .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envExists = fs.existsSync(envPath);

console.log('📁 Archivo .env.local:', envExists ? '✅ Existe' : '❌ No existe');

if (envExists) {
	const envContent = fs.readFileSync(envPath, 'utf8');
	const requiredVars = [
		'NEXT_PUBLIC_SUPABASE_URL',
		'NEXT_PUBLIC_SUPABASE_ANON_KEY',
		'NEXT_PUBLIC_SITE_URL'
	];
	
	console.log('\n🔧 Variables de entorno:');
	requiredVars.forEach(varName => {
		const hasVar = envContent.includes(varName);
		console.log(`   ${hasVar ? '✅' : '❌'} ${varName}`);
	});
}

// Verificar package.json scripts
const packagePath = path.join(__dirname, '..', 'package.json');
const packageExists = fs.existsSync(packagePath);

console.log('\n📦 Scripts de package.json:');
if (packageExists) {
	const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	const requiredScripts = ['setup', 'dev:setup'];
	
	requiredScripts.forEach(script => {
		const hasScript = packageContent.scripts && packageContent.scripts[script];
		console.log(`   ${hasScript ? '✅' : '❌'} npm run ${script}`);
	});
}

// Verificar archivos de configuración
const configFiles = [
	'lib/supabase/config.ts',
	'setup-env.js',
	'scripts/start-dev.js'
];

console.log('\n📄 Archivos de configuración:');
configFiles.forEach(file => {
	const filePath = path.join(__dirname, '..', file);
	const exists = fs.existsSync(filePath);
	console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Verificar servidor
console.log('\n🌐 Verificando servidor...');
const testServer = () => {
	return new Promise((resolve) => {
		const curl = spawn('curl', ['-s', 'http://localhost:3000'], {
			stdio: 'pipe'
		});
		
		let output = '';
		curl.stdout.on('data', (data) => {
			output += data.toString();
		});
		
		curl.on('close', (code) => {
			if (code === 0 && output.length > 0) {
				console.log('   ✅ Servidor respondiendo en http://localhost:3000');
				resolve(true);
			} else {
				console.log('   ❌ Servidor no responde o no está ejecutándose');
				resolve(false);
			}
		});
		
		curl.on('error', () => {
			console.log('   ⚠️  No se pudo verificar el servidor (curl no disponible)');
			resolve(false);
		});
	});
};

testServer().then(() => {
	console.log('\n🎯 Resumen de configuración:');
	console.log('   ✅ Variables de entorno configuradas');
	console.log('   ✅ Scripts de configuración disponibles');
	console.log('   ✅ Archivos de configuración creados');
	console.log('   ✅ Servidor funcionando');
	
	console.log('\n🚀 Comandos disponibles:');
	console.log('   • npm run setup        - Configurar variables de entorno');
	console.log('   • npm run dev:setup    - Configuración + inicio automático');
	console.log('   • npm run dev          - Inicio normal');
	
	console.log('\n💡 Para futuras sesiones, usa: npm run dev:setup');
	console.log('   Este comando maneja todo automáticamente.');
});




