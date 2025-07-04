'use client'
import { useState } from "react";

const PractiseAreasComponent = () => {
   const services = [
    {
      title: "Corporate Law",
      subtitle: "Comprehensive legal services for business formation, mergers & acquisitions, corporate governance, and compliance. Our experienced team guides companies through complex transactions and regulatory requirements."
    },
    {
      title: "Litigation & Dispute Resolution",
      subtitle: "Expert representation in civil litigation, arbitration, and mediation. We handle commercial disputes, contract breaches, and complex litigation matters with strategic precision."
    },
    {
      title: "Employment Law",
      subtitle: "Complete employment law services including workplace policies, discrimination claims, wrongful termination, and labor relations. Protecting both employers and employees' rights."
    },
    {
      title: "Real Estate Law",
      subtitle: "Full-service real estate legal support covering property transactions, zoning issues, landlord-tenant disputes, and commercial real estate development projects."
    },
    {
      title: "Intellectual Property",
      subtitle: "Protect your innovations with our IP services including trademark registration, patent applications, copyright protection, and IP litigation defense."
    },
    {
      title: "Family Law",
      subtitle: "Compassionate legal guidance for divorce proceedings, child custody, adoption, prenuptial agreements, and other sensitive family matters."
    },
    {
      title: "Criminal Defense",
      subtitle: "Aggressive defense representation for criminal charges ranging from misdemeanors to serious felonies. Protecting your rights throughout the legal process."
    },
    {
      title: "Tax Law",
      subtitle: "Strategic tax planning, compliance, and dispute resolution services for individuals and businesses. Navigate complex tax regulations with confidence."
    }
  ];

       
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
    return (<div className="bg-primary">
    <div className="section-container section-spacing">
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" onMouseLeave={() => setHoveredIndex(0)} >
          
    {services.map((service, index) => (
  <div
    key={index}
    className={`p-8 rounded-lg transition-all duration-300 ${
      hoveredIndex === index ? "bg-secondary" : "border-white border-solid border-2"
    }`}
    onMouseEnter={() => setHoveredIndex(index)}
    onMouseLeave={() => setHoveredIndex(null)}
  >
    <h3 className="font-marcellus text-2xl text-white mb-4">
      {service.title}
    </h3>
    <p className="font-jost text-white/90 mb-6">{service.subtitle}</p>
    <a className="flex items-center text-white font-jost group" href="/hire-a-lawyer/#ask-a-lawyer" onClick={() => setHoveredIndex(index)}>
      Ask a Lawyer
    </a>
    <hr className="h-0.5 w-20 bg-white" />
  </div>
))}

    </div> </div></div> );
}
 
export default PractiseAreasComponent;