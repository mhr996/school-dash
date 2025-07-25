import React from 'react';
import { CarContract } from '@/types/contract';
import { getTranslation } from '@/i18n';

interface ContractTemplateProps {
    contract: CarContract;
    language?: string;
}

const ArabicContractTemplate: React.FC<ContractTemplateProps> = ({ contract }) => {
    const { t } = getTranslation();

    // Format date to Arabic format (Gregorian calendar)
    const formatDate = (date: string) => {
        // ar-EG uses Gregorian calendar with Arabic numerals
        return (
            new Date(date).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }) + ' م'
        ); // Add ميلادي suffix
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'ILS',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div id="contract-template" className="rtl p-8 text-right font-arabic" style={{ direction: 'rtl' }}>
            <h1 className="text-2xl font-bold mb-8 text-center">اتفاقية بيع مركبة</h1>

            <p className="mb-6">تم توقيع هذه الاتفاقية وإبرامها في يوم {formatDate(contract.dealDate)}</p>

            <div className="mb-8">
                <h2 className="font-bold mb-2">البائع:</h2>
                <p>اسم المعرض / الشركة: {contract.sellerName}</p>
                <p>رقم الملف الضريبي/السجل التجاري: {contract.sellerTaxNumber}</p>
                <p>العنوان: {contract.sellerAddress}</p>
                <p>رقم الهاتف: {contract.sellerPhone}</p>
            </div>

            <div className="mb-8">
                <h2 className="font-bold mb-2">المشتري:</h2>
                <p>الاسم الكامل: {contract.buyerName}</p>
                <p>رقم الهوية: {contract.buyerId}</p>
                <p>العنوان: {contract.buyerAddress}</p>
                <p>رقم الهاتف: {contract.buyerPhone}</p>
            </div>

            <div className="mb-8">
                <h2 className="font-bold mb-4">1. تفاصيل المركبة المباعة</h2>
                <p>نوع المركبة: {contract.carType}</p>
                <p>الشركة المصنعة: {contract.carMake}</p>
                <p>الطراز: {contract.carModel}</p>
                <p>سنة الصنع: {contract.carYear}</p>
                <p>رقم التسجيل (لوحة): {contract.carPlateNumber}</p>
                <p>رقم الهيكل: {contract.carVin}</p>
                <p>رقم المحرك: {contract.carEngineNumber}</p>
                <p>عدد الكيلومترات الحالي: {contract.carKilometers}</p>
            </div>

            <div className="mb-8">
                <h2 className="font-bold mb-4">2. طبيعة الصفقة</h2>
                <p>
                    <label>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <input type="checkbox" checked={contract.dealType === 'normal'} readOnly /> بيع عادي
                        </span>
                    </label>
                </p>
                <p>
                    <label>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <input type="checkbox" checked={contract.dealType === 'trade-in'} readOnly /> صفقة استبدال (تريد إن)
                        </span>
                    </label>
                </p>

                {contract.dealType === 'trade-in' && contract.tradeInCar && (
                    <div className="mt-4">
                        <p>تفاصيل مركبة المشتري التي تم تسليمها كجزء من الصفقة:</p>
                        <p>نوع المركبة: {contract.tradeInCar.type}</p>
                        <p>رقم التسجيل: {contract.tradeInCar.plateNumber}</p>
                        <p>سنة الصنع: {contract.tradeInCar.year}</p>
                        <p>قيمة المركبة المقدّرة من قبل البائع: {formatCurrency(contract.tradeInCar.estimatedValue)}</p>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <h2 className="font-bold mb-4">3. المقابل المالي</h2>
                <p>اتفق الطرفان على أن يدفع المشتري للبائع مبلغاً إجمالياً قدره:</p>
                <p className="font-bold my-2">{formatCurrency(contract.totalAmount)}</p>

                <div className="mt-4">
                    <p>طريقة الدفع:</p>
                    <p>
                        <label>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <input type="checkbox" checked={contract.paymentMethod === 'cash'} readOnly /> نقدًا
                            </span>
                        </label>
                    </p>
                    <p>
                        <label>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <input type="checkbox" checked={contract.paymentMethod === 'bank_transfer'} readOnly /> تحويل بنكي
                            </span>
                        </label>
                    </p>
                    <p>
                        <label>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <input type="checkbox" checked={contract.paymentMethod === 'check'} readOnly /> شيك/شيكات
                            </span>
                            {contract.paymentMethod === 'check' && contract.paymentDetails && <span> – أرقام الشيكات: {contract.paymentDetails}</span>}
                        </label>
                    </p>
                    <p>
                        <label>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <input type="checkbox" checked={contract.paymentMethod === 'other'} readOnly /> أخرى:
                            </span>
                            {contract.paymentMethod === 'other' && contract.paymentDetails && <span> {contract.paymentDetails}</span>}
                        </label>
                    </p>
                </div>

                <div className="mt-4">
                    <p>المبلغ المدفوع عند توقيع الاتفاق: {formatCurrency(contract.paidAmount)}</p>
                    {contract.remainingAmount > 0 && (
                        <p>
                            المبلغ المتبقي: {formatCurrency(contract.remainingAmount)}
                            {contract.remainingPaymentDate && ` حتى تاريخ ${formatDate(contract.remainingPaymentDate)}`}
                        </p>
                    )}
                </div>
            </div>

            <div className="mb-8">
                <h2 className="font-bold mb-4">4. شروط الاتفاق</h2>
                <ul className="list-disc mr-6 space-y-2">
                    <li>تُباع المركبة بحالتها الراهنة ("كما هي").</li>
                    <li>يقرّ المشتري بأنه فحص المركبة وقادها، ولا يملك أي اعتراض على حالتها الفنية أو الشكلية.</li>
                    <li>يلتزم البائع بنقل ملكية المركبة خلال {contract.ownershipTransferDays} أيام عمل.</li>
                    <li>يكون المشتري مسؤولًا عن أي مخالفة أو غرامة أو رسوم أو أضرار بعد تاريخ التوقيع.</li>
                    <li>في حال كانت المركبة محجوزة أو مرهونة – يلتزم البائع برفع الحجز أو الرهن قبل نقل الملكية.</li>
                    {contract.dealType === 'trade-in' && <li>في حال شملت الصفقة استبدال مركبة – يكون المشتري مسؤولاً عن حالة المركبة المسلّمة ويقرّ بأنه سلّمها بعد إفصاح كامل عن وضعها.</li>}
                </ul>
            </div>

            <div className="mb-8">
                <h2 className="font-bold mb-4">5. الإقرارات</h2>
                <ul className="list-disc mr-6 space-y-2">
                    <li>يقر الطرفان بصحة جميع التفاصيل وموافقتهما على الاتفاق بكامل إرادتهما.</li>
                    <li>يدرك الطرفان أن هذه الاتفاقية ملزمة قانونياً.</li>
                </ul>
            </div>

            <div className="mt-12">
                <h2 className="font-bold mb-4">التواقيع</h2>
                <div className="flex justify-between">
                    <div>
                        <p>توقيع البائع: ______________________</p>
                        <p>التاريخ: {formatDate(contract.dealDate)}</p>
                    </div>
                    <div>
                        <p>توقيع المشتري: ______________________</p>
                        <p>التاريخ: {formatDate(contract.dealDate)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArabicContractTemplate;
