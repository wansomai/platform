'use client'
import { slugify } from "@/lib/utils";
import { useState } from "react";



interface PractiseAreasComponentProps {
  areas: any[];
}

const PractiseAreasComponent = ({ areas }: PractiseAreasComponentProps) => {


       
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);

    return (<div className="bg-primary">
    <div className="section-container section-spacing">
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" onMouseLeave={() => setHoveredIndex(0)} >
          
    {areas.map((service, index) => (
  <div
    key={index}
    className={`p-8 rounded-lg transition-all duration-300 ${
      hoveredIndex === index ? "bg-secondary" : "border-white border-solid border-2"
    }`}
    onMouseEnter={() => setHoveredIndex(index)}
    onMouseLeave={() => setHoveredIndex(null)}
  >
    <h3 className="font-marcellus text-2xl text-white mb-4">
      {service.fields.title}
    </h3>
    <p className="font-jost text-white/90 mb-6">{service.fields.metaDescription}</p>
    <a className="flex items-center text-white font-jost group" href={`/lawyer-network/${slugify(service.fields.title)}`} onClick={() => setHoveredIndex(index)}>
     learn more
    </a>
    <hr className="h-0.5 w-20 bg-white" />
  </div>
))}

    </div> </div></div> );
}
 
export default PractiseAreasComponent;