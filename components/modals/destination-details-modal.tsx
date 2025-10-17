'use client';
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '@/i18n';
import { getPublicUrlFromPath } from '@/utils/file-upload';
import IconX from '@/components/icon/icon-x';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconUser from '@/components/icon/icon-user';
import IconHeart from '@/components/icon/icon-heart';
import IconAward from '@/components/icon/icon-award';
import IconSettings from '@/components/icon/icon-settings';
import IconCoffee from '@/components/icon/icon-coffee';
import IconCar from '@/components/icon/icon-car';
import IconHome from '@/components/icon/icon-home';
import IconSun from '@/components/icon/icon-sun';
import IconBook from '@/components/icon/icon-book';
import IconClock from '@/components/icon/icon-clock';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconArrowForward from '@/components/icon/icon-arrow-forward';
import IconEye from '../icon/icon-eye';
import IconShoppingBag from '@/components/icon/icon-shopping-bag';
import IconUsersGroup from '@/components/icon/icon-users-group';

type Destination = {
    id: string;
    name: string;
    address: string | null;
    phone?: string | null;
    description?: string | null;
    zone_id: string | null;
    thumbnail_path: string | null;
    gallery_paths?: string[] | null;
    properties_details: Array<{ value: string; icon: string | null }> | null;
    suitable_for_details: Array<{ value: string }> | null;
    requirements: string[] | null;
    pricing: { student?: number; crew?: number } | null;
};

type Zone = {
    id: string;
    name: string;
};

interface DestinationDetailsModalProps {
    destination: Destination | null;
    zones: Zone[];
    isOpen: boolean;
    onClose: () => void;
}

// Helper function to get icon for property
const getPropertyIcon = (property: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
        indoor_activities: IconHome,
        outdoor_activities: IconSun,
        educational_value: IconBook,
        entertainment_value: IconAward,
        historical_significance: IconClock,
        natural_beauty: IconHeart,
        accessibility: IconUser,
        parking_available: IconCar,
        restroom_facilities: IconSettings,
        food_services: IconCoffee,
        gift_shop: IconShoppingBag,
        guided_tours: IconUsersGroup,
        audio_guides: IconBook, // Using book icon as alternative for audio guides
        wheelchair_accessible: IconUser, // Using user icon as alternative for wheelchair accessibility
        group_discounts: IconUsersGroup,
    };
    return iconMap[property] || IconSettings;
};

// Helper function to get icon for requirement
const getRequirementIcon = (requirement: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
        paramedics: IconHeart,
        guides: IconUser,
        security_companies: IconSettings,
        external_entertainment_companies: IconAward,
    };
    return iconMap[requirement] || IconUser;
};

const DestinationDetailsModal: React.FC<DestinationDetailsModalProps> = ({ destination, zones, isOpen, onClose }) => {
    const { t } = getTranslation();

    // Gallery state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

    // Reset gallery when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setCurrentImageIndex(0);
        }
    }, [isOpen, destination?.id]);

    // Get all images (thumbnail + gallery)
    const allImages = React.useMemo(() => {
        const images: string[] = [];
        if (destination?.thumbnail_path) {
            images.push(destination.thumbnail_path);
        }
        if (destination?.gallery_paths && destination.gallery_paths.length > 0) {
            images.push(...destination.gallery_paths);
        }
        return images;
    }, [destination]);

    const nextImage = useCallback(() => {
        if (!destination?.gallery_paths || destination.gallery_paths.length === 0) return;
        setLightboxImageIndex((prev) => (prev + 1) % destination.gallery_paths!.length);
    }, [destination?.gallery_paths?.length]);

    const prevImage = useCallback(() => {
        if (!destination?.gallery_paths || destination.gallery_paths.length === 0) return;
        setLightboxImageIndex((prev) => (prev - 1 + destination.gallery_paths!.length) % destination.gallery_paths!.length);
    }, [destination?.gallery_paths?.length]);

    const goToImage = useCallback((index: number) => {
        setLightboxImageIndex(index);
    }, []);

    const openLightbox = useCallback((index: number) => {
        setLightboxImageIndex(index);
        setIsLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => {
        setIsLightboxOpen(false);
    }, []);

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isLightboxOpen || !destination?.gallery_paths || destination.gallery_paths.length <= 1) return;

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                prevImage();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                nextImage();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeLightbox();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, destination?.gallery_paths?.length, prevImage, nextImage, closeLightbox]);
    if (!destination) return null;

    const getZoneName = (zoneId: string | null) => {
        if (!zoneId) return t('unknown_zone');
        const zone = zones.find((z) => z.id === zoneId);
        return zone?.name || t('unknown_zone');
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            y: 100,
            rotateX: -15,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 300,
                damping: 30,
                duration: 0.4,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            y: -100,
            rotateX: 15,
            transition: {
                duration: 0.3,
            },
        },
    };

    const contentVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.2,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden">
                    {/* Backdrop */}
                    <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

                    {/* Modal */}
                    <motion.div
                        className="relative bg-white/10 dark:bg-slate-900/20 backdrop-blur-2xl rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-white/20 dark:border-slate-700/30 shadow-2xl"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Single Thumbnail */}
                        <motion.div className="relative h-80 overflow-hidden" variants={itemVariants}>
                            <img
                                src={destination.thumbnail_path ? getPublicUrlFromPath(destination.thumbnail_path) : '/assets/images/img-placeholder-fallback.webp'}
                                alt={destination.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Close Button */}
                            <motion.button
                                onClick={onClose}
                                className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all duration-300"
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <IconX className="w-6 h-6 text-white" />
                            </motion.button>

                            {/* Title Overlay */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <motion.h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg" variants={itemVariants}>
                                    {destination.name}
                                </motion.h1>
                                <motion.div className="flex items-center text-white/90 text-lg" variants={itemVariants}>
                                    <IconMapPin className="w-5 h-5 mr-2" />
                                    <span className="drop-shadow">{getZoneName(destination.zone_id)}</span>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Content */}
                        <motion.div className="p-8 overflow-y-auto max-h-[60vh] pb-16" variants={contentVariants} initial="hidden" animate="visible">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Description */}
                                    {destination.description && (
                                        <motion.div variants={itemVariants}>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <IconBook className="w-4 h-4 text-white" />
                                                </div>
                                                {t('description')}
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{destination.description}</p>
                                        </motion.div>
                                    )}

                                    {/* Properties */}
                                    {destination.properties_details && destination.properties_details.length > 0 && (
                                        <motion.div variants={itemVariants}>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                                                    <IconAward className="w-4 h-4 text-white" />
                                                </div>
                                                {t('destination_features')}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {destination.properties_details.map((property, idx) => {
                                                    const IconComponent = getPropertyIcon(property.value);
                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            className="flex items-center gap-3 p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/40"
                                                            whileHover={{ scale: 1.02, y: -2 }}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                        >
                                                            {property.icon ? (
                                                                <img src={getPublicUrlFromPath(property.icon)} alt={property.value} className="w-5 h-5 object-contain" />
                                                            ) : (
                                                                <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                            )}
                                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                                {property.value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                                            </span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Requirements */}
                                    {destination.requirements && destination.requirements.length > 0 && (
                                        <motion.div variants={itemVariants}>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                                                    <IconSettings className="w-4 h-4 text-white" />
                                                </div>
                                                {t('trip_requirements')}
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {destination.requirements.map((requirement, idx) => {
                                                    const IconComponent = getRequirementIcon(requirement);
                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            className="flex items-center gap-2 px-4 py-2 bg-amber-200/30 dark:bg-amber-500/20 backdrop-blur-sm rounded-full border border-amber-300/50 dark:border-amber-500/30"
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: idx * 0.1 }}
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            <IconComponent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{t(requirement)}</span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Suitable For */}
                                    {destination.suitable_for_details && destination.suitable_for_details.length > 0 && (
                                        <motion.div variants={itemVariants}>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center">
                                                    <IconUser className="w-4 h-4 text-white" />
                                                </div>
                                                {t('suitable_for')}
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {destination.suitable_for_details.map((suitable, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        className="px-4 py-2 bg-indigo-200/30 dark:bg-indigo-500/20 backdrop-blur-sm rounded-full border border-indigo-300/50 dark:border-indigo-500/30 flex items-center gap-2"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        whileHover={{ scale: 1.05 }}
                                                    >
                                                        <IconUsersGroup className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                                                            {suitable.value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Contact Information */}
                                    {(destination.address || destination.phone) && (
                                        <motion.div variants={itemVariants}>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                                                    <IconMapPin className="w-4 h-4 text-white" />
                                                </div>
                                                {t('contact_information')}
                                            </h3>
                                            <div className="space-y-3">
                                                {destination.address && (
                                                    <div className="flex items-start gap-3 p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/40">
                                                        <IconMapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('address')}</p>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{destination.address}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {destination.phone && (
                                                    <div className="flex items-center gap-3 p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/40">
                                                        <IconPhone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('phone_number')}</p>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{destination.phone}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Pricing */}
                                    {destination.pricing && (
                                        <motion.div variants={itemVariants}>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                                                    <IconCreditCard className="w-4 h-4 text-white" />
                                                </div>
                                                {t('trip_pricing')}
                                            </h3>
                                            <div className="bg-gradient-to-r from-emerald-100/40 to-blue-100/40 dark:from-emerald-800/30 dark:to-blue-800/30 backdrop-blur-md rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-700/40 shadow-lg">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    {destination.pricing.student && (
                                                        <motion.div
                                                            className="text-center p-3 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-white/50 dark:border-slate-600/50"
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('pricing_student')}</p>
                                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">₪{destination.pricing.student}</p>
                                                        </motion.div>
                                                    )}
                                                    {destination.pricing.crew && (
                                                        <motion.div
                                                            className="text-center p-3 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-white/50 dark:border-slate-600/50"
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-2"></div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('pricing_crew')}</p>
                                                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">₪{destination.pricing.crew}</p>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* Starting From */}
                                                <motion.div
                                                    className="bg-gradient-to-r from-emerald-500/80 to-blue-500/80 backdrop-blur-md rounded-lg p-4 text-center border border-emerald-400/30"
                                                    whileHover={{ scale: 1.02 }}
                                                >
                                                    <p className="text-sm font-medium text-white/90 mb-1">{t('trip_starting_from')}</p>
                                                    <p className="text-2xl font-bold text-white">₪{Math.min(...Object.values(destination.pricing).filter((price) => price != null))}</p>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Gallery Section */}
                                {destination.gallery_paths && destination.gallery_paths.length > 0 && (
                                    <motion.div variants={itemVariants} className="col-span-full mt-8">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-pink-500 rounded-lg flex items-center justify-center">
                                                <IconCoffee className="w-4 h-4 text-white" />
                                            </div>
                                            {t('gallery')}
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {destination.gallery_paths.map((imagePath, index) => (
                                                <motion.div
                                                    key={index}
                                                    className="relative aspect-square bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/30 dark:border-slate-700/40 cursor-pointer group"
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => openLightbox(index)}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <img
                                                        src={getPublicUrlFromPath(imagePath)}
                                                        alt={`${destination.name} - Gallery Image ${index + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                                        <motion.div
                                                            className="opacity-0 group-hover:opacity-100 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30"
                                                            initial={{ scale: 0.8 }}
                                                            whileHover={{ scale: 1.1 }}
                                                        >
                                                            <IconEye className="w-6 h-6 text-white" />
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        {/* Lightbox */}
                        <AnimatePresence>
                            {isLightboxOpen && (
                                <motion.div
                                    className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={closeLightbox}
                                >
                                    <motion.div
                                        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Close Button */}
                                        <motion.button
                                            onClick={closeLightbox}
                                            className="absolute top-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 z-50"
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <IconX className="w-6 h-6 text-white" />
                                        </motion.button>

                                        {/* Image */}
                                        <AnimatePresence mode="wait">
                                            <motion.img
                                                key={lightboxImageIndex}
                                                src={getPublicUrlFromPath(destination.gallery_paths![lightboxImageIndex])}
                                                alt={`${destination.name} - Gallery Image ${lightboxImageIndex + 1}`}
                                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </AnimatePresence>

                                        {/* Navigation */}
                                        {destination.gallery_paths && destination.gallery_paths.length > 1 && (
                                            <>
                                                <motion.button
                                                    onClick={prevImage}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300"
                                                >
                                                    <IconArrowLeft className="w-7 h-7 text-white rotate-180" />
                                                </motion.button>

                                                <motion.button
                                                    onClick={nextImage}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300"
                                                >
                                                    <IconArrowLeft className="w-7 h-7 text-white" />
                                                </motion.button>

                                                {/* Image Counter */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                                                    <span className="text-white text-sm font-medium">
                                                        {lightboxImageIndex + 1} / {destination.gallery_paths.length}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DestinationDetailsModal;
