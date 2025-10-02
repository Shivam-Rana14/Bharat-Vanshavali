"use client"

import { motion } from "framer-motion"
import { Users, Shield, MapPin, Heart } from 'lucide-react'
import { AnimatedCounter } from "./animated-counter"

const stats = [
  {
    icon: Users,
    value: 50000,
    suffix: "+",
    label: "Families Connected",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    value: 1000000,
    suffix: "+",
    label: "Records Preserved",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: MapPin,
    value: 28,
    suffix: "",
    label: "States Covered",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Heart,
    value: 99,
    suffix: "%",
    label: "Privacy Protected",
    color: "from-purple-500 to-pink-500"
  }
]

export function StatsSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Families Across India
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of families who have already started their genealogical journey with us
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <motion.div
                className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <stat.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </motion.div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm md:text-base text-gray-600 font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 