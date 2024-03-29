
import {Page,Badge,Pagination,Divider, Card,ResourceList,
  Filters,ChoiceList,Text} from '@shopify/polaris';
import React, { useEffect, useState,useCallback,useMemo} from 'react';
import { useDebounce } from 'use-debounce';
import Job from './Job';
import './JobList.css';
import {SEARCH_QUERY} from '../../Graphql/Queries.js';
import {JOB_QUERY} from '../../Graphql/Queries.js'; 

import { useMutation, useQuery } from '@apollo/client';

export default function JobList() {

  const [queryValue, setQueryValue] = useState("");
  const [sortValue, setSortValue] = useState("DESC");
  const [pageValue, setPageValue] = useState(1);
  const [value,setValue]=useState([]);
  const [input] = useDebounce(queryValue, 350);
  const [sort, setSort] = useState('');
  
  const { loading, data:listJob } = useQuery(JOB_QUERY, {
    variables: {
      page: pageValue,
      pageSize: 2,
      sort: sortValue,  
    },
    fetchPolicy: "network-only",
    skip: queryValue === "" ? false : true,
  });

  const { loading: searchJobLoading, data: SearchJob , error: searchJobError}=useQuery(SEARCH_QUERY,{
    variables: {
      name: input,
      page: 1,
      limit: 4,
      sort: sortValue,
    },
    fetchPolicy: "network-only",
    skip: queryValue !== "" ? false : true,
  });
 
  const handleSortChange = useCallback(
    (value) => setSort(value),
    console.log('sort',sort),
    [],
  );
 
  const handleFiltersQueryChange = useCallback(
    (value) => setQueryValue(value),
    console.log('queryValue',queryValue),
    [],
  );
  const handleSortRemove = useCallback(
    () => setSort(undefined),
    [],
  );
 
  const handleQueryValueRemove = useCallback(
    () => setQueryValue(undefined),
    [],
  );
  const handleFiltersClearAll = useCallback(() => {
    handleSortRemove();
    handleQueryValueRemove();
  }, [
    handleSortRemove,
    handleQueryValueRemove,
   
  ]);
 const filters = [
    {
      key: 'sort',
      label: 'Sort',
      filter: (
        <ChoiceList
          title="Sort"
          titleHidden
          choices={[
            {label: 'Newest update', value: 'DESC'},
            {label: 'Oldest update', value: 'ASC'},
          
          ]}
          selected={sort || []}
          onChange={handleSortChange}
          
        />
      ),
      shortcut: true,
    },
    
  ];
  const appliedFilters = [];
  if (!isEmpty(sort)) {
    const key = 'sort';
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, sort),
      onRemove: handleSortRemove,
    });
  }
  
  useEffect(() => {
    if (listJob && listJob.jobs && listJob.jobs.jobs) {
    console.log(listJob.jobs.jobs);
     setValue(listJob.jobs.jobs)}
     if (searchJobError) {
      console.error("Error fetching search results:", searchJobError);
    }
  }, [listJob,pageValue,SearchJob]);
  
  const items = useMemo(() => {
    if (listJob) {
      return listJob?.jobs?.jobs;
    }
    if (SearchJob) {
      console.log('SearchJob',SearchJob.jobs);
      return SearchJob?.searchJob?.jobs;
      
    }
    return [];
  }, [listJob,SearchJob]);

  const filteredItems = items.filter(item => {
    return (
      !queryValue ||
      item.title.toLowerCase().includes(queryValue.toLowerCase()) ||
      item.description.toLowerCase().includes(queryValue.toLowerCase())
    );
  });
  return (
    <>
    <Page
      backAction={{content: 'Products', url: '#'}}
      title="Job List"
      titleMetadata={<Badge tone="attention">Verified</Badge>}
      primaryAction={{content: 'Create Job',
                       url: "./NewJob",
                      }}
      
      >
        <div style={{ height: '568px' }}>
          <Card>
            <ResourceList
            resourceName={{ singular: 'customer', plural: 'customers' }}
             filterControl={
              <Filters
               queryValue={queryValue}
               filters={filters}
              appliedFilters={appliedFilters}
              onQueryChange={handleFiltersQueryChange}
              onQueryClear={handleQueryValueRemove}
              onClearAll={handleFiltersClearAll}
            />
           }
          flushFilters
          items={filteredItems}
          renderItem={(item) => {
            console.log('item', item);
            return (
              <ResourceList.Item
                id={item.id}
                accessibilityLabel={`View details for ${item.id}`} 
              >
               <Job value={item} key={item.index}/> 
              </ResourceList.Item>
            );
          }}
           />
         </Card>
        </div>
      
      <Divider/>
      <div className='paginathionStyle'>
      <Pagination
      hasPrevious
      onPrevious={() => {
        console.log('Previous',pageValue);
        if(pageValue>1){
        setPageValue(pageValue-1)}
        else{alert('first page')
        setPageValue(1)}
      }}
      hasNext
      onNext={() => {
        console.log('Next',pageValue);
        if(pageValue>0){
        setPageValue(pageValue+1)}
        else {
          alert('end page')
          setPageValue(3)
        }
      }}
      />
      </div>
    </Page>
    </>
  );
  function disambiguateLabel(key,value) {
    switch (key) {
      case 'moneySpent':
        return `Money spent is between $${value[0]} and $${value[1]}`;
      default:
        return value;
    }
  }
  function isEmpty(value){
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === '' || value == null;
    }
  }
}
