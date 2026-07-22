import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// ============================================================
// CONFIGURACION
// ============================================================
const String baseUrl = 'https://rhclaroni.com/control-acceso-api';
const Color primaryColor = Color(0xFFDA121A);

// ============================================================
// MODELOS
// ============================================================
class Edificio {
  final int id;
  final String nombre;
  Edificio({required this.id, required this.nombre});
  factory Edificio.fromJson(Map<String, dynamic> json) =>
      Edificio(id: json['Id'] ?? json['id'], nombre: json['Nombre'] ?? json['nombre']);
}

class RegistroAcceso {
  final int id;
  final String tipoPersona;
  final String nombre;
  final String? edificio;
  final DateTime fechaEntrada;
  final DateTime? fechaSalida;
  RegistroAcceso({
    required this.id, required this.tipoPersona, required this.nombre,
    this.edificio, required this.fechaEntrada, this.fechaSalida,
  });
  factory RegistroAcceso.fromJson(Map<String, dynamic> json) => RegistroAcceso(
    id: json['id'], tipoPersona: json['tipoPersona'], nombre: json['nombre'],
    edificio: json['edificio'],
    fechaEntrada: DateTime.parse(json['fechaEntrada']),
    fechaSalida: json['fechaSalida'] != null ? DateTime.parse(json['fechaSalida']) : null,
  );
}

class EmpleadoSearch {
  final String carnet;
  final String nombre;
  final String? gerencia;
  EmpleadoSearch({required this.carnet, required this.nombre, this.gerencia});
  factory EmpleadoSearch.fromJson(Map<String, dynamic> json) =>
      EmpleadoSearch(carnet: json['carnet'], nombre: json['nombre'] ?? json['nombreCompleto'], gerencia: json['gerencia']);
}

// ============================================================
// API SERVICE
// ============================================================
class AccesoApiService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<String?> getToken() => _storage.read(key: 'token');

  Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // AUTH
  Future<Map<String, dynamic>> loginEmpleado(String carnet) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/dev-login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'carnet': carnet}),
    );
    if (res.statusCode != 200) throw Exception('Error de autenticación');
    final data = jsonDecode(res.body);
    await _storage.write(key: 'token', value: data['access_token']);
    await _storage.write(key: 'user', value: jsonEncode(data['user']));
    return data;
  }

  Future<Map<String, dynamic>> loginCPF(String username, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/cpf-login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    if (res.statusCode != 200) throw Exception('Error de autenticación');
    final data = jsonDecode(res.body);
    await _storage.write(key: 'token', value: data['access_token']);
    await _storage.write(key: 'user', value: jsonEncode(data['user']));
    return data;
  }

  Future<void> logout() async {
    await _storage.deleteAll();
  }

  // ACCESO
  Future<List<RegistroAcceso>> accesosHoy({int? edificioId}) async {
    var url = '$baseUrl/acceso/hoy';
    if (edificioId != null) url += '?edificioId=$edificioId';
    final res = await http.get(Uri.parse(url), headers: await _headers());
    if (res.statusCode != 200) return [];
    return (jsonDecode(res.body) as List).map((e) => RegistroAcceso.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> registrarEntrada({
    required int edificioId, required String tipoPersona,
    required String personaId, required String nombrePersona,
    String? cedulaPersona, String? empresaPersona, int? eventoCursoId,
  }) async {
    final body = <String, dynamic>{
      'edificioId': edificioId, 'tipoPersona': tipoPersona,
      'personaId': personaId, 'nombrePersona': nombrePersona,
    };
    if (cedulaPersona != null) body['cedulaPersona'] = cedulaPersona;
    if (empresaPersona != null) body['empresaPersona'] = empresaPersona;
    if (eventoCursoId != null) body['eventoCursoId'] = eventoCursoId;

    final res = await http.post(
      Uri.parse('$baseUrl/acceso/entrada'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    if (res.statusCode != 201) throw Exception('Error al registrar entrada');
    return jsonDecode(res.body);
  }

  Future<void> registrarSalida(int id) async {
    final res = await http.post(
      Uri.parse('$baseUrl/acceso/salida/$id'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) throw Exception('Error al registrar salida');
  }

  Future<List<EmpleadoSearch>> searchEmpleado(String q) async {
    final res = await http.get(
      Uri.parse('$baseUrl/search/empleado?q=$q'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) return [];
    return (jsonDecode(res.body) as List).map((e) => EmpleadoSearch.fromJson(e)).toList();
  }

  Future<List<Edificio>> getEdificios() async {
    final res = await http.get(Uri.parse('$baseUrl/edificios'), headers: await _headers());
    if (res.statusCode != 200) return [];
    return (jsonDecode(res.body) as List).map((e) => Edificio.fromJson(e)).toList();
  }
}

// ============================================================
// APP
// ============================================================
void main() {
  runApp(const ControlAccesoApp());
}

class ControlAccesoApp extends StatelessWidget {
  const ControlAccesoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Control Acceso',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const LoginPage(),
    );
  }
}

// ============================================================
// LOGIN PAGE
// ============================================================
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _api = AccesoApiService();
  bool _isCpf = false;
  final _carnetCtrl = TextEditingController();
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';

  Future<void> _login() async {
    setState(() { _loading = true; _error = ''; });
    try {
      if (_isCpf) {
        await _api.loginCPF(_userCtrl.text.trim(), _passCtrl.text);
      } else {
        await _api.loginEmpleado(_carnetCtrl.text.trim());
      }
      if (mounted) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardPage()));
      }
    } catch (e) {
      setState(() => _error = 'Error de autenticación');
    }
    setState(() => _loading = false);
  }

  @override
  void dispose() {
    _carnetCtrl.dispose();
    _userCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.door_front_door, size: 64, color: primaryColor),
            const SizedBox(height: 12),
            Text('Control Acceso', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            // Tabs
            Row(children: [
              Expanded(child: _tabButton('Empleado', !_isCpf, () => setState(() => _isCpf = false))),
              Expanded(child: _tabButton('Externo', _isCpf, () => setState(() => _isCpf = true))),
            ]),
            const SizedBox(height: 20),
            if (_isCpf) ...[
              TextField(controller: _userCtrl, decoration: const InputDecoration(labelText: 'Usuario', border: OutlineInputBorder()), textInputAction: TextInputAction.next),
              const SizedBox(height: 12),
              TextField(controller: _passCtrl, decoration: const InputDecoration(labelText: 'Contraseña', border: OutlineInputBorder()), obscureText: true, onSubmitted: (_) => _login()),
            ] else ...[
              TextField(controller: _carnetCtrl, decoration: const InputDecoration(labelText: 'Carnet', border: OutlineInputBorder()), keyboardType: TextInputType.number, onSubmitted: (_) => _login()),
            ],
            if (_error.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13))),
            const SizedBox(height: 16),
            SizedBox(width: double.infinity, child: ElevatedButton(
              onPressed: _loading ? null : _login,
              style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
              child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Ingresar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            )),
          ]),
        ),
      ),
    );
  }

  Widget _tabButton(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: active ? primaryColor : Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(child: Text(label,
          style: TextStyle(fontWeight: FontWeight.bold, color: active ? Colors.white : Colors.grey[700]),
        )),
      ),
    );
  }
}

// ============================================================
// DASHBOARD PAGE
// ============================================================
class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});
  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final _api = AccesoApiService();
  List<RegistroAcceso> _hoy = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final hoy = await _api.accesosHoy();
    setState(() { _hoy = hoy; _loading = false; });
  }

  Future<void> _salida(int id) async {
    try {
      await _api.registrarSalida(id);
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final dentro = _hoy.where((r) => r.fechaSalida == null).length;
    return Scaffold(
      appBar: AppBar(title: const Text('Control Acceso'), actions: [
        IconButton(icon: const Icon(Icons.logout), onPressed: () async {
          await _api.logout();
          if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginPage()));
        }),
      ]),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(padding: const EdgeInsets.all(16), children: [
            // KPIs
            Row(children: [
              _kpiCard('Entradas', _hoy.length, Colors.green),
              const SizedBox(width: 8),
              _kpiCard('Salidas', _hoy.length - dentro, Colors.blue),
              const SizedBox(width: 8),
              _kpiCard('Dentro', dentro, Colors.orange),
            ]),
            const SizedBox(height: 16),
            // Boton Registro
            SizedBox(width: double.infinity, child: ElevatedButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegistroPage())),
              icon: const Icon(Icons.add),
              label: const Text('Registrar Entrada'),
              style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
            )),
            const SizedBox(height: 16),
            Text('Accesos de Hoy', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ..._hoy.map((r) => Card(
              child: ListTile(
                leading: CircleAvatar(backgroundColor: primaryColor, child: Text(r.nombre[0], style: const TextStyle(color: Colors.white))),
                title: Text(r.nombre, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${r.tipoPersona} · ${r.edificio ?? ""}\n${_formatDate(r.fechaEntrada)} - ${r.fechaSalida != null ? _formatDate(r.fechaSalida!) : "Dentro"}'),
                trailing: r.fechaSalida == null
                  ? TextButton(onPressed: () => _salida(r.id), child: const Text('Salida', style: TextStyle(color: Colors.red)))
                  : null,
              ),
            )),
          ]),
      ),
    );
  }

  Widget _kpiCard(String label, int value, Color color) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color.withAlpha(30), borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        Text('$value', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
      ]),
    ));
  }

  String _formatDate(DateTime dt) => '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
}

// ============================================================
// REGISTRO PAGE
// ============================================================
class RegistroPage extends StatefulWidget {
  const RegistroPage({super.key});
  @override
  State<RegistroPage> createState() => _RegistroPageState();
}

class _RegistroPageState extends State<RegistroPage> {
  final _api = AccesoApiService();
  List<Edificio> _edificios = [];
  int? _edificioId;
  String _tipo = 'EMPLEADO';
  final _searchCtrl = TextEditingController();
  List<EmpleadoSearch> _results = [];
  EmpleadoSearch? _selected;
  final _nombreCtrl = TextEditingController();
  final _cedulaCtrl = TextEditingController();
  final _empresaCtrl = TextEditingController();
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _api.getEdificios().then((e) => setState(() => _edificios = e));
  }

  Future<void> _search() async {
    if (_searchCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    final r = await _api.searchEmpleado(_searchCtrl.text);
    setState(() { _results = r; _loading = false; });
  }

  Future<void> _registrar() async {
    if (_edificioId == null) return;
    try {
      await _api.registrarEntrada(
        edificioId: _edificioId!,
        tipoPersona: _tipo,
        personaId: _selected?.carnet ?? 'manual',
        nombrePersona: _selected?.nombre ?? _nombreCtrl.text,
        cedulaPersona: _cedulaCtrl.text,
        empresaPersona: _empresaCtrl.text,
      );
      if (mounted) Navigator.pop(context);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar Entrada')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Tipo selector
        Wrap(spacing: 6, runSpacing: 6, children: [
          ['EMPLEADO', 'Colaborador'], ['PROVEEDOR', 'Proveedor'],
          ['VISITANTE', 'Visitante'], ['INSTRUCTOR_EXTERNO', 'Facilitador Externo'],
          ['INSTRUCTOR_INTERNO', 'Facilitador Interno'],
        ].map((t) => ChoiceChip(
          label: Text(t[1], style: const TextStyle(fontSize: 12)),
          selected: _tipo == t[0],
          onSelected: (_) => setState(() { _tipo = t[0]; _selected = null; _results = []; }),
        )).toList()),
        const SizedBox(height: 12),

        // Search
        if (_tipo != 'VISITANTE') ...[
          Row(children: [
            Expanded(child: TextField(controller: _searchCtrl, decoration: const InputDecoration(labelText: 'Buscar', border: OutlineInputBorder(), hintText: 'Nombre o carnet'), onSubmitted: (_) => _search())),
            const SizedBox(width: 8),
            IconButton(onPressed: _search, icon: const Icon(Icons.search)),
          ]),
          ..._results.map((r) => ListTile(
            dense: true, title: Text(r.nombre), subtitle: Text(r.carnet),
            onTap: () => setState(() { _selected = r; _results = []; }),
          )),
          if (_selected != null) Chip(label: Text(_selected!.nombre), onDeleted: () => setState(() => _selected = null)),
        ],

        // Manual for visitantes
        if (_tipo == 'VISITANTE') ...[
          TextField(controller: _nombreCtrl, decoration: const InputDecoration(labelText: 'Nombre completo *', border: OutlineInputBorder())),
          const SizedBox(height: 8),
          TextField(controller: _cedulaCtrl, decoration: const InputDecoration(labelText: 'Cédula', border: OutlineInputBorder())),
          const SizedBox(height: 8),
          TextField(controller: _empresaCtrl, decoration: const InputDecoration(labelText: 'Empresa / Motivo', border: OutlineInputBorder())),
        ],

        const SizedBox(height: 16),
        // Edificio
        DropdownButtonFormField<int>(
          value: _edificioId,
          items: _edificios.map((e) => DropdownMenuItem(value: e.id, child: Text(e.nombre))).toList(),
          onChanged: (v) => setState(() => _edificioId = v),
          decoration: const InputDecoration(labelText: 'Edificio *', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 20),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: _registrar,
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
          child: const Text('Registrar Entrada', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        )),
      ]),
    );
  }
}
