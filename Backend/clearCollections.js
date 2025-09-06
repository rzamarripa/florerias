import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import all the models
import { ImportedInvoices } from './src/models/ImportedInvoices.js';
import { InvoicesPackage } from './src/models/InvoicesPackpage.js';
import { AuthorizationFolio } from './src/models/AuthorizationFolio.js';
import { PaymentsByProvider } from './src/models/PaymentsByProvider.js';
import { ScheduledPayment } from './src/models/ScheduledPayment.js';
import { CashPayment } from './src/models/CashPayment.js';
import { InvoicesPackageCompany } from './src/models/InvoicesPackpageCompany.js';
import { Budget } from './src/models/Budget.js';

// Load environment variables
dotenv.config();

const clearCollections = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Collections to clear with their names for logging
    const collectionsToClean = [
      { model: ImportedInvoices, name: 'ImportedInvoices (cc_imported_invoices)' },
      { model: InvoicesPackage, name: 'InvoicesPackage (cc_invoices_package)' },
      { model: AuthorizationFolio, name: 'AuthorizationFolio (cc_authorization_folio)' },
      { model: PaymentsByProvider, name: 'PaymentsByProvider (cc_payments_by_provider)' },
      { model: ScheduledPayment, name: 'ScheduledPayment (rs_scheduled_payment)' },
      { model: CashPayment, name: 'CashPayment (cc_cash_payment)' },
      { model: InvoicesPackageCompany, name: 'InvoicesPackageCompany (rs_invoices_packages_companies)' },
      { model: Budget, name: 'Budget (cc_budget)' }
    ];

    console.log('Starting collection cleanup...\n');

    // Clear each collection
    for (const { model, name } of collectionsToClean) {
      try {
        const count = await model.countDocuments();
        if (count > 0) {
          const result = await model.deleteMany({});
          console.log(`✅ ${name}: Deleted ${result.deletedCount} records`);
        } else {
          console.log(`ℹ️  ${name}: Collection already empty`);
        }
      } catch (error) {
        console.error(`❌ Error clearing ${name}:`, error.message);
      }
    }

    console.log('\n🎉 Collection cleanup completed!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('📤 Database connection closed');
    process.exit(0);
  }
};

// Add confirmation prompt for safety
const args = process.argv.slice(2);
const forceMode = args.includes('--force');

if (!forceMode) {
  console.log('⚠️  WARNING: This script will DELETE ALL records from the following collections:');
  console.log('- ImportedInvoices (cc_imported_invoices)');
  console.log('- InvoicesPackage (cc_invoices_package)');
  console.log('- AuthorizationFolio (cc_authorization_folio)');
  console.log('- PaymentsByProvider (cc_payments_by_provider)');
  console.log('- ScheduledPayment (rs_scheduled_payment)');
  console.log('- CashPayment (cc_cash_payment)');
  console.log('- InvoicesPackageCompany (rs_invoices_packages_companies)');
  console.log('- Budget (cc_budget)');
  console.log('\nTo proceed, run the script with --force flag:');
  console.log('node clearCollections.js --force');
  process.exit(0);
}

// Run the cleanup
clearCollections();