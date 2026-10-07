const { sequelize, Laboratorio, Medicamento, Tenant, asegurarTenantPorDefecto } = require('../models');

const insertarDatos = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Tablas creadas');

    // Tenants (farmacias)
    const tenant1 = await asegurarTenantPorDefecto();
    const tenant2 = await Tenant.create({ nombre: 'Farmacia Sur', activo: true });
    console.log('Tenants insertados');

    // Insertar Laboratorios
    const lab1 = await Laboratorio.create({
      razonSocial: 'Laboratorios Pfizer S.A.',
      direccion: 'Av. Javier Prado 1234, Lima',
      telefono: '01-4567890',
      email: 'contacto@pfizer.pe',
      contacto: 'Carlos Mendoza'
    });

    const lab2 = await Laboratorio.create({
      razonSocial: 'Bayer S.A.',
      direccion: 'Calle Las Begonias 567, San Isidro',
      telefono: '01-2345678',
      email: 'ventas@bayer.pe',
      contacto: 'Ana Torres'
    });

    console.log('Laboratorios insertados');

    // Insertar Medicamentos (todos pertenecen al tenant por defecto)
    await Medicamento.bulkCreate([
      {
        descripcionMed: 'Paracetamol 500mg',
        fechaFabricacion: '2026-01-15',
        fechaVencimiento: '2028-01-15',
        Presentacion: 'Caja x 20 tabletas',
        stock: 150,
        precioVentaUni: 2.50,
        precioVentaPres: 45.00,
        Marca: 'Tylenol',
        CodLab: lab1.CodLab,
        CodTenant: tenant1.CodTenant
      },
      {
        descripcionMed: 'Ibuprofeno 400mg',
        fechaFabricacion: '2026-03-10',
        fechaVencimiento: '2027-03-10',
        Presentacion: 'Caja x 30 tabletas',
        stock: 200,
        precioVentaUni: 3.00,
        precioVentaPres: 80.00,
        Marca: 'Advil',
        CodLab: lab2.CodLab,
        CodTenant: tenant1.CodTenant
      },
      {
        descripcionMed: 'Amoxicilina 500mg',
        fechaFabricacion: '2026-05-20',
        fechaVencimiento: '2027-05-20',
        Presentacion: 'Caja x 21 cápsulas',
        stock: 80,
        precioVentaUni: 5.50,
        precioVentaPres: 110.00,
        Marca: 'Amoxil',
        CodLab: lab1.CodLab,
        CodTenant: tenant1.CodTenant
      },
      {
        descripcionMed: 'Loratadina 10mg (otra farmacia)',
        fechaFabricacion: '2026-02-01',
        fechaVencimiento: '2028-02-01',
        Presentacion: 'Caja x 10 tabletas',
        stock: 40,
        precioVentaUni: 1.50,
        precioVentaPres: 25.00,
        Marca: 'Clarin',
        CodLab: lab2.CodLab,
        CodTenant: tenant2.CodTenant
      }
    ]);

    console.log('Medicamentos insertados');
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

insertarDatos();
